const mysql = require('mysql2/promise');
const axios = require('axios');

const databasePassword = process.env.DB_PASSWORD;
const databaseUser = process.env.DB_USER;
const databasePort = process.env.DB_PORT;
const databaseHostName = process.env.DB_HOST_NAME;
const databaseName = process.env.DB_NAME;
const rapidKey = process.env.RAPID_KEY;

const Config = {
    host: databaseHostName,
    port: databasePort,
    user: databaseUser,
    password: databasePassword,
    database: databaseName
}

const fetchQuotes = async ()=>{
    const options = {
        method: 'GET',
        url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/get-trending-tickers',
        params: {region: 'US'},
        headers: {
          'X-RapidAPI-Key': rapidKey,
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

export const handler = async (event, context)=>{
    // fetch quotes
    const quotes = await fetchQuotes();
    // fetch quotes
    let connection;
    try{
        // create connection
        connection = await mysql.createConnection(Config);
        console.info("********connection made*******");
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
        console.info("***********records inserted***********");
        // insert data
        
        // close the connection
        connection.end();
    }catch(err){
        console.error(err);
        if(connection){
            connection.end();
        }
    }
}