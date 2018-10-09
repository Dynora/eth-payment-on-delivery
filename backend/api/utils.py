import json

from django.conf import settings
from web3 import Web3, HTTPProvider


def get_web3_object():
    return Web3(HTTPProvider(settings.ETH_NETWORKS[settings.ETH_CURRENT_NETWORK]))


def get_contract_object(web3, name):
    with open('../build/contracts/{}.json'.format(name), 'r') as json_file:
        contract_data = json.load(json_file)
        contract_address = settings.ETH_CONTRACT_ADDRESS[settings.ETH_CURRENT_NETWORK]

        return web3.eth.contract(abi=contract_data["abi"], address=contract_address)


def send_signed_transaction(web3, tx_info):
    tx_info["nonce"] = web3.eth.getTransactionCount(settings.ETH_MERCHANT_ADDRESS)

    signed_tx = web3.eth.account.signTransaction(tx_info, settings.ETH_MERCHANT_PRIVATE_KEY)

    tx_hash = web3.eth.sendRawTransaction(signed_tx.rawTransaction)
    return tx_hash
