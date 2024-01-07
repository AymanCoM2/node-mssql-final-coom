const sql = require("mssql");
const express = require("express");
const app = express();
const port = 3000; // you can use any port you prefer

const config = {
  user: "ayman",
  password: "admin@1234",
  server: "10.10.10.100",
  database: "AljouaiT",
  encrypt: true,
  trustServerCertificate: true,
  requestTimeout: 50000,
  connectionTimeout: 35000,
};

function executeQuery(query) {
  return new Promise((resolve, reject) => {
    const pool = new sql.ConnectionPool(config);

    pool
      .connect()
      .then((pool) => {
        return pool.request().query(query);
      })
      .then((result) => {
        sql.close(); // Close the connection pool
        resolve(result.recordset);
      })
      .catch((err) => {
        sql.close(); // Close the connection pool in case of an error
        reject(err);
      });
  });
}

const queries = [
  `
  WITH TOP5 AS (
    SELECT TOP 5 T0.DocEntry
    FROM OINV T0
    LEFT JOIN [@MobileNumber] M0 ON T0.DocEntry = M0.DocEntry
    WHERE M0.Phone = '" . $phone . "'
    ORDER BY T0.DocEntry DESC
)
, Last5Records AS (
    SELECT T0.DocEntry, 
        CASE WHEN ISNULL(T0.LicTradNum, '') = '' THEN N'فاتورة ضريبية مبسطة'
        ELSE N'فاتورة ضريبية' END AS 'InvoiceTitle',
        T0.CardName, T0.CardCode, T0.LicTradNum, T0.DocDate, T0.DocDueDate,
        CONCAT(ISNULL(N1.SeriesName, ''), T0.DocNum) AS 'DocNum',
        (T0.DocTotal + T0.DiscSum - T0.RoundDif - T0.VatSum) AS 'NetTotalBefDisc',
        T0.DiscPrcnt AS 'DiscPrcntG', T0.DiscSum,
        (T0.DocTotal - T0.RoundDif - T0.VatSum) AS 'NetTotalBefVAT',
        T0.VatSum, T0.DocTotal, T00.U_NAME, T0.Comments, 
        CASE 
            WHEN LEFT(T00.USER_CODE, 2) = 'S2' THEN N'العنوان : القصيم - بريدة - الشماس - شارع الصناعة'
            WHEN LEFT(T00.USER_CODE, 2) = 'S4' THEN N'العنوان : حفر الباطن- المحمدية - شارع الملك فيصل'
            ELSE N'العنوان : القصيم - بريدة - القادسية - شارع الأمير فيصل بن مشعل'
        END AS 'Branch'
    FROM AljouaiT.DBO.OINV T0
    LEFT JOIN AljouaiT.DBO.NNM1 N1 ON N1.Series = T0.Series
    LEFT JOIN AljouaiT.DBO.OUSR T00 ON T0.USERSIGN = T00.INTERNAL_K
    WHERE T0.CANCELED = 'N' AND T0.DocEntry IN (SELECT * FROM TOP5)
)
SELECT * FROM Last5Records
UNION
SELECT TOP 5 T0.DocEntry, 
    CASE WHEN ISNULL(T0.LicTradNum, '') = '' THEN N'فاتورة ضريبية مبسطة'
    ELSE N'فاتورة ضريبية' END AS 'InvoiceTitle',
    CASE WHEN T0.CardCode = 'C0000' THEN CONCAT(T0.CardName, ' ', ISNULL(T0.NumAtCard, ' '))
    ELSE T0.CardName END AS 'CardName', T0.CardCode, T0.LicTradNum, T0.DocDate, T0.DocDueDate,
    CONCAT(ISNULL(N1.SeriesName, ''), T0.DocNum) AS 'DocNum',
    (T0.DocTotal + T0.DiscSum - T0.RoundDif - T0.VatSum) AS 'NetTotalBefDisc',
    T0.DiscPrcnt AS 'DiscPrcntG', T0.DiscSum,
    (T0.DocTotal - T0.RoundDif - T0.VatSum) AS 'NetTotalBefVAT',
    T0.VatSum, T0.DocTotal, T00.U_NAME, T0.Comments, 
    CASE 
        WHEN LEFT(T00.USER_CODE, 2) = 'S2' THEN N'العنوان : القصيم - بريدة - الشماس - شارع الصناعة'
        WHEN LEFT(T00.USER_CODE, 2) = 'S4' THEN N'العنوان : حفر الباطن- المحمدية - شارع الملك فيصل'
        ELSE N'العنوان : القصيم - بريدة - القادسية - شارع الأمير فيصل بن مشعل'
    END AS 'Branch'
FROM AljouaiT.DBO.OINV T0
LEFT JOIN AljouaiT.DBO.NNM1 N1 ON N1.Series = T0.Series
LEFT JOIN AljouaiT.DBO.OUSR T00 ON T0.USERSIGN = T00.INTERNAL_K
WHERE T0.CANCELED = 'N' AND T0.DocEntry NOT IN (SELECT * FROM TOP5)
ORDER BY T0.DocEntry DESC;
`,
];

app.get("/api/data", (req, res) => {
  queryPromise = executeQuery(queries[0]);
  queryPromise
    .then((result) => {
      console.log(`Query completed:`, result[0]);
      // res.json(result[0]);
    })
    .catch((err) => {
      console.error(`Query failed:`, err);
      // res.json(err);
    });
  // Send the JSON response
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
