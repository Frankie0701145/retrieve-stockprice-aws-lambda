const mysql = require('mysql2/promise');
const axios = require('axios');

const Config = {
    host: "stock-prices2.cpomh9kl0278.eu-west-1.rds.amazonaws.com",
    port: "3306",
    user: "admin",
    password: "stockPrices2023;",
    database: "stock_prices"
}

const fetchQuotes = async ()=>{
    const options = {
        method: 'GET',
        url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/get-trending-tickers',
        params: {region: 'US'},
        headers: {
          'X-RapidAPI-Key': '64174d1a2bmshbaa9943f1601efcp11bc86jsn13f6e4a02765',
          'X-RapidAPI-Host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
        }
    };
    try{
        let response = await axios.request(options);
        const quotes = response.data.finance.result[0].quotes
        return quotes.map((quote)=>([
            quote.longName,// company_name
            quote.symbol,// symbol
            quote.regularMarketPrice,// price
            quote.regularMarketChangePercent// percent_change
        ]))
    }catch(err){
        console.log(err)
    }
}

const handler = async (event, context)=>{
    // fetch quotes
    const quotes = await fetchQuotes();
    // fetch quotes

    try{
        // create connection
        const connection = await mysql.createConnection(Config);
        console.log("********connection made*******");
        // create connection

        // create table if does not exists
        const createTableDoesExists = "CREATE TABLE IF NOT EXISTS StockPrice ( company_id integer NOT NULL AUTO_INCREMENT, company_name VARCHAR(50), symbol VARCHAR(20), price decimal(10,2), percent_change decimal(10,2), PRIMARY KEY (company_id) );"
        await connection.execute(createTableDoesExists)
        // create table if does not exists

        // truncate the stock prices
        const truncateTable = "TRUNCATE TABLE StockPrice"
        await connection.execute(truncateTable)
        // truncate the stock prices

        // insert data
        const insertPricesQuery = "INSERT INTO StockPrice (company_name, symbol, price, percent_change) VALUES ?"
        await connection.query(insertPricesQuery, [quotes]);
        console.log("records inserted");
        // insert data
        
        // close the connection
        connection.end();
    }catch(err){
        console.log(err);
        connection.end();
    }
}