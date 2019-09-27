/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'connection-org1.json');
const express = require('express');
const bodyParser =  require('body-parser');



const app = express();
app.use(bodyParser.json());



let gettxid = (asset) => {
    return new Promise((resolve, reject) => {
        async function getid(asset) {
            try {

                // Create a new file system based wallet for managing identities.
                const walletPath = path.join(process.cwd(), 'wallet');
                const wallet = new FileSystemWallet(walletPath);
                console.log(`Wallet path: ${walletPath}`);

                // Check to see if we've already enrolled the user.
                const userExists = await wallet.exists('user1');
                if (!userExists) {
                    console.log('An identity for the user "user1" does not exist in the wallet');
                    console.log('Run the registerUser.js application before retrying');
                    return;
                }

                // Create a new gateway for connecting to our peer node.
                const gateway = new Gateway();
                await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: false, asLocalhost: false }} );

                // Get the network (channel) our contract is deployed to.
                const network = await gateway.getNetwork('mychannel');

                // Get the contract from the network.
                const contract = network.getContract('newchaincode1');

                const myTx = contract.createTransaction('createContract');
                if(!asset.docType){
                    throw error;
                }
                if(!asset.encryptionKey){
                    throw error;
                }
                if(!asset.hash){
                    throw error;
                }
                if(!asset.name){
                    asset.name = 'NA';
                }
                if(!asset.note){
                    asset.note = 'NA';
                }
        
                await myTx.submit(asset.docType,asset.encryptionKey ,asset.hash,asset.name,asset.note);
                const txId = myTx.getTransactionID();
                console.log('Transaction has been submitted');
                // console.log(txId);

                // Disconnect from the gateway.
                await gateway.disconnect();
                console.log('executed');
                resolve(txId);
            } catch (error) {
                console.error(`Failed to submit transaction: ${error}`);
                reject(error);
                process.exit(1);
            }
        }
        getid(asset);
    });

};

let getdetails = (txid) => {
    return new Promise((resolve, reject) => {
        async function tmp (txid) {
            try{
                if(!txid)
                {
                    throw error;
                }
                // Create a new file system based wallet for managing identities.
                const walletPath = path.join(process.cwd(), 'wallet');
                const wallet = new FileSystemWallet(walletPath);
                console.log(`Wallet path: ${walletPath}`);

                // Check to see if we've already enrolled the user.
                const userExists = await wallet.exists('user1');
                if (!userExists) {
                    console.log('An identity for the user "user1" does not exist in the wallet');
                    console.log('Run the registerUser.js application before retrying');
                    return;
                }

                // Create a new gateway for connecting to our peer node.
                const gateway = new Gateway();
                await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: false, asLocalhost: false }} );

                // Get the network (channel) our contract is deployed to.
                const network = await gateway.getNetwork('mychannel');
                const channel = network.getChannel();
                // Get the contract from the network.

                let response_payload = await channel.queryTransaction(txid);
                resolve (response_payload);
            }catch(err){
                console.log(err);
                reject(err);
            }
        }
        tmp(txid);
    });
};


app.post('/transaction',(req, response) => {
    console.log(req.body);
    try{
        // let details = getDetaills(req.body.txid);
        getdetails(req.body.id).then(res => {
            let output = res.transactionEnvelope.payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[1].rwset.writes;
            delete output.is_delete;
            console.log(output)
            let withoutSlashes = output[0].value.replace(/\\/g, "");
            let withoutQuotes = withoutSlashes.replace(/""/g, '"');
            let final = JSON.parse(withoutQuotes);
            final.transactionId = req.body.id;
            let d = new Date();
            let n = d.toISOString();
            final.timestamp = n;
            console.log({final});
            response.send(final);
        });
    }catch (err){
        response.sendStatus(500);
        console.log('err');
    }
});

app.post('/add-transaction',(req, response) => {
    console.log(req.body);
    
    gettxid(req.body).then(res => {
        delete res._nonce;
        delete res._admin;
        res.transactionId = res._transaction_id;
        delete res._transaction_id;
    response.send(res);
    }).catch (err => {
        response.sendStatus(500);
        console.log(err);
    });
    // response.send(txid);
    // test(req.body);
    // response.sendStatus(200);
});


app.listen(3000, () => {
    console.log('Started on port 3000');
});