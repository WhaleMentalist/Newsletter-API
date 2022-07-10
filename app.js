const url = require("node:url");
const path = require("node:path");

const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const mailchimp = require("@mailchimp/mailchimp_marketing");

// Get configuration file for API key
const config = require("./config/configuration.json");
mailchimp.setConfig({
  apiKey: config.mailchimpApiKey,
  server: config.mailchimpServer
});

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/css", express.static(path.join(__dirname, "css")));

// Allows user to get homepage on request
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/signup.html");
});

app.post("/", function(req, res) {

  // Constructing user object to pass to API
  const subscribingUser = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email
  };

  // On success show user success page, otherwise show failure page with error
  addUserToList(subscribingUser, config.mailchimpListId).then((success) => {
    success ? res.sendFile(__dirname + "/public/success.html") :
              res.sendFile(__dirname + "/public/failure.html");
  });
});

app.post("/failure", function(req, res) {
  res.redirect("/");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server is up!");
});

async function addUserToList(user, listId) {
  try {
    const response = await mailchimp.lists.addListMember(listId, {
      email_address: user.email,
      status: "subscribed",
      merge_fields: {
        FNAME: user.firstName,
        LNAME: user.lastName
      }
    });

    return true;
  }
  catch(e) {
    console.error(`Error adding user to list (${e.status})`);
    return false;
  }
}
