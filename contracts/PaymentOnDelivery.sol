pragma solidity ^0.4.18;

contract PaymentOnDelivery {

    struct Delivery {
        address customer;
        address merchant;
        uint deposit;
        uint timeout;
        bool active;
    }

    mapping (bytes32 => Delivery) deliveries;
    mapping (address => bytes32[]) merchant_delivery_ids;
    mapping (address => bytes32[]) customer_delivery_ids;

    event DeliveryCreated(address merchant, bytes32 deliveryId);

    function createDelivery(address merchant, uint duration) public payable returns (bytes32) {
        if (msg.value == 0) { revert(); }
        if (merchant == msg.sender) { revert(); }

        // The merchant should have reasonable time to settle the channel
        // TODO if (duration < 3600) { revert(); }

        // Generate channel id
        uint delivery_timeout = now + duration;

        bytes32 delivery_id = keccak256(msg.sender, merchant, block.timestamp);

        Delivery memory channel;

        channel.customer = msg.sender;
        channel.merchant = merchant;
        channel.deposit = msg.value;
        channel.timeout = delivery_timeout;
        channel.active = true;

        deliveries[delivery_id] = channel;
        customer_delivery_ids[msg.sender].push(delivery_id);
        merchant_delivery_ids[merchant].push(delivery_id);

        DeliveryCreated(merchant, delivery_id);

    }

    function settleDelivery(bytes32 delivery_id, uint value, bytes signature) public {
        Delivery memory _channel = deliveries[delivery_id];

        // Check if delivery is still active
        if (!_channel.active) { revert(); }
        // Check if channel is not already timed out
        if (now > _channel.timeout) { revert(); }
        // Only merchant is allowed to settle channel
        if (msg.sender != _channel.merchant) { revert(); }
        // Value cannot be higher than deposit
        if (value > _channel.deposit) { revert(); }

        if (value == 0) { value = _channel.deposit; }

        // Check if signature matches customer address
        if (_channel.customer != getApprovedAmountAddress(delivery_id, value, signature)) { revert(); }

        if (_channel.deposit > 0 && value > 0) {
            // Send agreed amount to merchant
            _channel.merchant.transfer(value);
            // TODO send fee to transporter

            if (_channel.deposit - value > 0) {

                // Send remainder to customer
                _channel.customer.transfer(_channel.deposit - value);
            }

//            // Delete channel
            deliveries[delivery_id].active = false;
//            delete deliveries[delivery_id];
//            delete active_delivery_ids[_channel.customer][_channel.merchant];
//            delete customer_delivery_ids[_channel.customer][_channel.merchant];
//            delete merchant_delivery_ids[_channel.customer][_channel.merchant];
        }
    }

    // As a way to prevent the merchant from forever blocking the funds in the
    // channel, create a timeout that will refund the funds to the payer,
    // encouraging to merchant to settle the channel
    function timeoutDelivery(bytes32 delivery_id) public {
        Delivery memory _channel = deliveries[delivery_id];

        if (now > _channel.timeout && _channel.active == true) {
            //Refund payer
            _channel.customer.transfer(_channel.deposit);

            // Delete channel
            deliveries[delivery_id].active = false;
//            delete deliveries[delivery_id];
//            delete active_delivery_ids[_channel.customer][_channel.merchant];
        }
    }

    function getDeliveryDeposit(bytes32 id) public constant returns (uint) {
        return deliveries[id].deposit;
    }

    function getDeliveryTimeout(bytes32 id) public constant returns (uint) {
        return deliveries[id].timeout;
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

    function getCustomerDeliveries(address customer) public constant returns (bytes32[]) {
        return customer_delivery_ids[customer];
    }

    function getMerchantDeliveries(address merchant) public constant returns (bytes32[]) {
        return merchant_delivery_ids[merchant];
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