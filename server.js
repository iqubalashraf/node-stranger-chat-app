const express = require('express');

const port = process.env.PORT || 3000;

var app = express();

app.use(express.static(__dirname));

app.listen(port, () =>{
	console.log(`Server is up on port ${port}`);
});