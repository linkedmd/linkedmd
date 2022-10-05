# Linked Markdown

Linked Markdown is a superset of [Markdown](https://daringfireball.net/projects/markdown/syntax) that provides support for declaring variables, referencing them and importing them from remote sources.

This is an example Linked Markdown document:

```markdown
NATION
: Import definitions ipfs://bafkreibrzdmvj3n3inklvyjp5c5wmqv4w6jnafz5paaxfyk27v47gjxmhe

Domain Name
: google.com

Seller
: 0xbac3ab60a1643e5f5de8eb62cb4bb232711d9dcd

Purchaser
: luisc.eth

Registrar
: GoDaddy

Purchase Price
: 12 NATION

---

## 1. Domain Name Sale and Ownership Transfer Agreement

This Domain Name Sale and Ownership Transfer Agreement ("Agreement”) is entered into between Seller and Domain Name. This agreement sets forth all terms and conditions under which Seller agrees to sell and transfer to Purchaser all ownership rights in and to the domain name Domain Name including any and all trademark rights and attendant goodwill associated therewith.

Seller and the Purchaser hereby agree as follows:

Purchase Price. In consideration for payment of Purchase Price, the sufficiency of which is hereby acknowledged, paid by Purchaser to Seller, Seller hereby assigns, sells, transfers and conveys to Purchaser all of Seller’s right, title, and interest in and to the Domain Name. Payment will be made in US dollars.
Seller’s Representations. Seller represents and warrants that it is the lawful and exclusive registrant of the Domain Name and no other party has any right to registration of the Domain Name or has otherwise made any claim to the Domain Name. Seller further represents and warrants that it has the exclusive authority to enter into this transaction and transfer the Domain Name, free of the claims of any third parties.
Transfer of the Domain Name. The Domain Name is registered with Registrar, an ICANN accredited registrar system. Upon confirmation of receipt of Purchase Price, Seller shall provide Purchaser with a password or Seller shall push the Domain Name to Purchaser’s account at Registrar within 2 days of receiving payment. This enables Purchaser to modify the registration information as desired, transfer the Domain Name to a different Registrar, and/or to change Purchaser’s password/username to take full control of the Domain Name.
Further Assurances. Seller shall take all necessary actions, including providing all necessary documentation to Purchaser in order to transfer Domain Name to Purchaser.
Governing Law. This Agreement is made under and shall be governed by and interpreted in accordance with the laws of Nation3, without regard to that state’s choice of law principles, which may direct the application of the laws of another jurisdiction.
Entire Agreement. This Agreement constitutes and contains the entire agreement between the parties with respect to the subject matter herein and supersedes any prior oral or written agreements. This Agreement cannot be changed, modified, amended, or supplemented, except in writing signed by all parties hereto. IN WITNESS WHEREOF, Seller and Purchaser have caused this Agreement to be executed by their duly authorized representatives.
```

A Linked Markdown document has two sections:

- A first section with definitions, both local and remotely imported ones.
- A second section with its content, in Markdown.

## Uses

The main intended use is writing legal agreements and law. Linked Markdown provides powerful features for such a use case, because it allows to:

- Import data and definitions from other documents, reducing the need to repeat a definition and the risk of omitting it, which in turn increases precision of language
- Quickly create sound agreements by importing existing definitions from other documents. An open-source approach to law
- Clearly define data at the beginning of a document, avoiding subjective definitions and loose ends
- Reference such data in the document and know at a glance the value of the references
