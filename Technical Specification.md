# **Technical Specification: Multi-Chain Transaction Exporter**

## **1\. Overview**

A high-performance, minimalist web tool designed to fetch transaction history from specific high-growth networks and export them into a standardized CSV format compatible with the **Awaken** tax platform.

## **2\. Core Functional Requirements**

The application must perform the following actions with zero friction:

* **Network Selection:** Toggle between supported networks:  
  * **Fuel**  
  * **Creditcoin**  
  * **Humanity Protocol**  
* **Data Retrieval:** Fetch all historical transactions for a provided wallet address via RPC or Indexer APIs.  
* **Data Parsing:** Standardize diverse transaction types (transfers, staking rewards, smart contract interactions) into a unified schema.  
* **Table Preview:** Display the latest transactions in a clean, scannable UI.  
* **CSV Export:** Generate a downloadable file matching the exact Awaken schema.

## **3\. Data Schema & CSV Mapping (Awaken Format)**

Every export must adhere to the following column headers and data types:

| Column | Description | Format Example |
| :---- | :---- | :---- |
| **Date (UTC)** | Timestamp of the transaction | MM/DD/YYYY HH:MM:SS |
| **Received Quantity** | Amount of tokens received | 125.50 |
| **Received Currency** | Ticker symbol of the asset | TICKER |
| **Sent Quantity** | Amount of tokens sent | 50.00 |
| **Sent Currency** | Ticker symbol of the asset | TICKER |
| **Fee Amount** | Gas/Network fee paid | 0.0002 |
| **Fee Currency** | Currency used for fees | TICKER |
| **Transaction Hash** | Unique transaction identifier | 0x... |

**Note:** For "Receive-only" events (e.g., Rewards), the "Sent" columns must remain empty. For "Send-only" events, the "Received" columns must remain empty.

## **4\. UI/UX Principles**

* **Minimalism:** Single-page application. One input field, one network selector, one primary action button.  
* **Performance:** Real-time loading states and optimistic UI updates.  
* **Error Handling:** Clear, user-friendly alerts for invalid addresses or network timeouts.  
* **Design:** High-contrast dark mode aesthetic with clear typography for financial data.

## **5\. Technical Constraints**

* **Format Compliance:** Strict adherence to the MM/DD/YYYY HH:MM:SS date format is mandatory for Awaken compatibility.  
* **Browser-Side Processing:** All CSV generation should happen client-side to ensure privacy and speed.  
* **Open Source:** The codebase should be clean, well-commented, and ready for public review.