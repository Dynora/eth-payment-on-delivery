pragma solidity ^0.4.18;

import "./Ownable.sol";

contract PaymentOnDelivery is Ownable {

    struct Delivery {
        address customer;
        address merchant;
        uint deposit;
        uint created;
        uint timeout;
        uint refunded;
        uint delivered;
        bool active;
        bytes32 transportId;
    }

    mapping (bytes32 => Delivery) deliveries;
    mapping (address => bytes32[]) merchant_delivery_ids;
    mapping (address => bytes32[]) customer_delivery_ids;

    struct Transport {
        bytes32[] deliveryIds;
        address transporter;
        address merchant;
        uint deliveryFee;
        uint deposit;
        uint depositReceived;
        uint created;
        uint timeout;
        uint finished;
        uint cancelled;
        uint depositClaimed;
    }

    mapping (bytes32 => Transport) public transports;
    mapping (address => bytes32) public current_transport_id;

    uint public delivery_fee = 0.01 ether;

    event DeliveryCreated(address merchant, bytes32 deliveryId);
    event DeliveryRefunded(bytes32 deliveryId);
    event DeliveryDelivered(bytes32 deliveryId);

    event TransportCreated(bytes32 transportId);
    event TransporterDeposit(address transporter, bytes32 transportId);
    event TransportFinished(bytes32 transportId);
    event TransportCancelled(bytes32 transportId);
    event TransportDepositClaimed(bytes32 transportId);

    function setDeliveryFee(uint fee) onlyOwner {
        delivery_fee = fee;
    }

    function createTransport(address transporter, uint duration, uint deposit, bytes32[] deliveryIds, uint deliveryFee) public returns (bytes32) {

        if (duration <= 0) { revert(); }
        if (deposit < 0) { revert(); }

        Transport memory transport;

        bytes32 transportId = keccak256(msg.sender, block.timestamp);
        transport.created = block.timestamp;
        transport.timeout = block.timestamp + duration;
        transport.deposit = deposit;
        transport.deliveryFee = deliveryFee;
        transport.merchant = msg.sender;

        // Check if transporter is available
        if (current_transport_id[transporter] != bytes32(0)) { revert(); }

        current_transport_id[transporter] = transportId;
        transport.transporter = transporter;

        if (deposit == 0) {
            transport.depositReceived = block.timestamp;
        }

        transports[transportId] = transport;

        for (uint i=0; i < deliveryIds.length; i++) {
          if (deliveries[deliveryIds[i]].merchant != msg.sender) { revert(); } // Only merchant of packages can create transport
          if (deliveries[deliveryIds[i]].transportId != bytes32(0)) { revert(); } // Only packages not already on transport allowed

          transports[transportId].deliveryIds.push(deliveryIds[i]);
          deliveries[deliveryIds[i]].transportId = transportId;
        }

        emit TransportCreated(transportId);
    }

    function cancelTransport(bytes32 transportId) public {
        Transport memory transport = transports[transportId];
        if (transport.merchant != msg.sender) { revert(); } // only merchant can cancel
        if (transport.cancelled > 0) { revert(); }

        transports[transportId].cancelled = block.timestamp;

        for (uint i=0; i < transport.deliveryIds.length; i++) {
          if (deliveries[transport.deliveryIds[i]].delivered > 0) { revert(); } //transport in progress cannot cancel

          deliveries[transport.deliveryIds[i]].transportId = bytes32(0);
        }

        // Refund deposit
        if (transport.depositReceived > 0 && transport.deposit > 0) {
            transport.transporter.transfer(transport.deposit);
        }

        current_transport_id[transport.transporter] = bytes32(0);

        emit TransportCancelled(transportId);
    }

    function depositTransport(bytes32 transportId) public payable {
        Transport memory transport = transports[transportId];
        if (transport.timeout < block.timestamp) { revert(); } // transport is already timed out
        if (transport.transporter != msg.sender) { revert(); } // only transporter can place deposit
        if (transport.cancelled > 0) { revert(); } // only place deposits for active transports
        if (transport.depositReceived > 0) { revert(); } // only place deposits for active transports
        if (transport.deposit == 0) { revert(); } // no deposit necessary
        if (transport.deposit != msg.value) { revert(); } // deposit does not match sent value


        transports[transportId].depositReceived = block.timestamp;
    }

    function finishTransport(bytes32 transportId) public {
        Transport memory transport = transports[transportId];

        // If transport is timed out than merchant is allowed to claim deposit of transporter
        if (transport.timeout < block.timestamp) {
            if (transport.depositClaimed > 0) { revert(); }

            transport.merchant.transfer(transport.deposit);

            transports[transportId].depositClaimed = block.timestamp;

            emit TransportDepositClaimed(transportId);
        }
        else
        {

            if (transport.finished > 0) { revert(); }

            // Check if all packages are delivered
            for (uint i=0; i < transport.deliveryIds.length; i++) {
              if (deliveries[transport.deliveryIds[i]].delivered == 0) { revert(); } //transport in progress cannot finish

            }

            // All packages delivered, return deposit to transporter
            transport.transporter.transfer(transport.deposit);

            transports[transportId].finished = block.timestamp;

            emit TransportFinished(transportId);

        }

        current_transport_id[transport.transporter] = bytes32(0);
    }


    function createDelivery(address merchant, uint duration) public payable returns (bytes32) {
        if (msg.value == 0) { revert(); }
        if (merchant == msg.sender) { revert(); }

        // The merchant should have reasonable time to settle the channel
        // TODO if (duration < 3600) { revert(); }

        // Generate channel id
        uint delivery_timeout = block.timestamp + duration;

        bytes32 delivery_id = keccak256(msg.sender, merchant, block.timestamp);

        Delivery memory channel;

        channel.customer = msg.sender;
        channel.merchant = merchant;
        channel.deposit = msg.value;
        channel.created = block.timestamp;
        channel.timeout = delivery_timeout;
        channel.active = true;

        deliveries[delivery_id] = channel;
        customer_delivery_ids[msg.sender].push(delivery_id);
        merchant_delivery_ids[merchant].push(delivery_id);

        emit DeliveryCreated(merchant, delivery_id);

    }

    function settleDelivery(bytes32 delivery_id, bytes signature) public {
        Delivery memory _channel = deliveries[delivery_id];

        // Check if delivery is still active
        if (!_channel.active) { revert(); }
        // Check if channel is not already timed out
        if (block.timestamp > _channel.timeout) { revert(); }

        uint value = _channel.deposit;

        // Check if signature matches customer address
        if (_channel.customer != getApprovedAmountAddress(delivery_id, value, signature)) { revert(); }

        if (_channel.deposit > 0 && value > 0) {
            // Send agreed amount minus fee to merchant
            _channel.merchant.transfer(value - delivery_fee);

            // Send fee to transporter
            msg.sender.transfer(delivery_fee);

            // Update delivery
            deliveries[delivery_id].active = false;
            deliveries[delivery_id].delivered = block.timestamp;

            emit DeliveryDelivered(delivery_id);
        }
    }

    // As a way to prevent the merchant from forever blocking the funds in the
    // channel, create a timeout that will refund the funds to the payer,
    // encouraging to merchant to settle the channel
    function timeoutDelivery(bytes32 delivery_id) public {
        Delivery memory _channel = deliveries[delivery_id];

        if (block.timestamp > _channel.timeout && _channel.active == true) {
            //Refund payer
            _channel.customer.transfer(_channel.deposit);

            // Update delivery
            deliveries[delivery_id].active = false;
            deliveries[delivery_id].refunded = block.timestamp;

            emit DeliveryRefunded(delivery_id);
        } else {
            revert();
        }
    }

    function getDeliveryDeposit(bytes32 id) public constant returns (uint) {
        return deliveries[id].deposit;
    }

    function getDeliveryCreated(bytes32 id) public constant returns (uint) {
        return deliveries[id].created;
    }

    function getDeliveryTimeout(bytes32 id) public constant returns (uint) {
        return deliveries[id].timeout;
    }

    function getDeliveryDelivered(bytes32 id) public constant returns (uint) {
        return deliveries[id].delivered;
    }

    function getDeliveryRefunded(bytes32 id) public constant returns (uint) {
        return deliveries[id].refunded;
    }

    function getDeliveryCustomer(bytes32 id) public constant returns (address) {
        return deliveries[id].customer;
    }

    function getDeliveryMerchant(bytes32 id) public constant returns (address) {
        return deliveries[id].merchant;
    }

    function getDeliveryActive(bytes32 id) public constant returns (bool) {
        return deliveries[id].active;
    }

    function getDeliveryTransportId(bytes32 id) public constant returns (bytes32) {
        return deliveries[id].transportId;
    }

    function getCustomerDeliveries(address customer) public constant returns (bytes32[]) {
        return customer_delivery_ids[customer];
    }

    function getMerchantDeliveries(address merchant) public constant returns (bytes32[]) {
        return merchant_delivery_ids[merchant];
    }

    function getTransportCreated(bytes32 id) public constant returns (uint) {
        return transports[id].created;
    }

    function getTransportTimeout(bytes32 id) public constant returns (uint) {
        return transports[id].timeout;
    }

    function getTransportFinished(bytes32 id) public constant returns (uint) {
        return transports[id].finished;
    }

    function getTransportTransporter(bytes32 id) public constant returns (address) {
        return transports[id].transporter;
    }

    function getTransportMerchant(bytes32 id) public constant returns (address) {
        return transports[id].merchant;
    }

    function getTransportDeposit(bytes32 id) public constant returns (uint) {
        return transports[id].deposit;
    }

    function getTransportDepositReceived(bytes32 id) public constant returns (uint) {
        return transports[id].depositReceived;
    }

    function getTransportDeliveryFee(bytes32 id) public constant returns (uint) {
        return transports[id].deliveryFee;
    }

    function getApprovedAmountAddress(bytes32 delivery_id, uint value, bytes signature) public pure returns (address) {

        bytes32 hash = keccak256(
            keccak256(
                'string description',
                'bytes32 delivery_id',
                'uint value'
            ),
            keccak256(
                'Approved amount signature',
                delivery_id,
                value
            )
        );
        address checked_sender = ecverify(hash, signature);
        return checked_sender;
    }

    function ecverify(bytes32 hash, bytes signature) internal pure returns (address signature_address) {
        require(signature.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        // The signature format is a compact form of:
        //   {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))

            // Here we are loading the last 32 bytes, including 31 bytes of 's'.
            v := byte(0, mload(add(signature, 96)))
        }

        // Version of signature should be 27 or 28, but 0 and 1 are also possible
        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28);

        signature_address = ecrecover(hash, v, r, s);

        // ecrecover returns zero on error
        require(signature_address != 0x0);

        return signature_address;
    }
}