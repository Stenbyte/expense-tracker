# Expense Tracker CLI

## Description

Expense Tracker CLI is a lightweight tool to help you manage expenses and budget directly from your terminal.  
You can add, update, delete, update, and list expenses stored in a JSON file. Budget will updated accoridingly on every command, except "list". As well user can export expenses and budget in csv file

## Features

- Add new expense.
- Update expense.
- Delete expense.
- View expenses.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher recommended)
- npm (comes with Node.js)

## Installation

- npm i

## How to use

- node index.js add coffe 20 office
- node index.js update 1 --n tea --a 10 --c home
- node index.js delete 1
- node index.js list --all
- node index.js budget --amount 100
- node index.js report

## Help

- To see all flags for specific feature run node index.js --help
