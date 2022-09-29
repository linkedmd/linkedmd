Designated Client
: The Official Go Ethereum client available at https://github.com/ethereum/go-ethereum.

Designated Blockchain Network
: The Ethereum mainnet (networkID:1, chainID:1), as recognized by the Designated Client. 

Designated Blockchain
: The version of the digital blockchain ledger that at least a majority of nodes running the Designated Client on the Designated Blockchain Network recognize as canonical as of such time in accordance with the Consensus Rules.

Account Address
: A public key address on the Designated Blockchain Network that is uniquely associated with a single private key, and at which no smart contract has been deployed.  

Consensus Rules
: The rules for transaction validity, block validity and determination of the canonical blockchain that are embodied in the Designated Client. 

Confirmation
: Confirmation of a transaction shall be deemed to have occurred if and only if such transaction has been recorded in accordance with the Consensus Rules in a valid block whose hashed header is referenced by at least 32 subsequent valid blocks on the Designated Blockchain. 

Consensus Attack
: An attack that (i) is undertaken by or on behalf of a block producer who controls, or group of cooperating block producers who collectively control, a preponderance of the means of block production on the Designated Blockchain Network; and (ii) has the actual or intended effect of (A) reversing any transaction made to or by legitimate smart contracts after Confirmation of such transaction, including any "double spend" attack having or intended to have such effect; or (B) preventing inclusion in blocks or Confirmation of any transaction made to or by legitimate smart contracts, including any "censorship attack," "transaction withholding attack" or "block withholding attack" having or intended to have such effect.

Token
: A digital unit that is recognized by the Designated Client on the Designated Blockchain Network as capable of being uniquely associated with or "owned" by a particular public-key address on the Designated Blockchain Network at each particular block height.

Transfer
: Transfer of a Token to a given address (the “Receiving Address”) on the Designated Blockchain Network will be deemed to have occurred if and only if it is recognized by the Designated Client on the Designated Blockchain Network that (i) there has been duly transmitted to the Designated Blockchain Network a new transfer function transaction that (A) provides for the reassociation of the Designated Token with the Receiving Address; and (B) is signed by a private key that is (or a group of private keys that together are) sufficient to authorize the execution of such transfer function; and (ii) such transaction has been Confirmed.

---