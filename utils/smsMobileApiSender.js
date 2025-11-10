const axios = require("axios");
const qs = require("querystring");

const SMS_API_KEY =
  process.env.SMS_API_KEY || "e4836702f3b07e6e9fe60c6310a971c557dd23bd7536fe1a";

async function sendGymSMS(number, message) {
  try {
    // Format to international number
    const formatted = number.startsWith("92")
      ? number
      : number.replace(/^0/, "92");

    // Prepare form data
    const body = qs.stringify({
      recipients: formatted,
      message: message,
      apikey: SMS_API_KEY,
    });

    const response = await axios.post(
      "https://api.smsmobileapi.com/sendsms/",
      body,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("[SMSMobileAPI] Response:", response.data);

    return (
      response.data &&
      JSON.stringify(response.data).toLowerCase().includes("success")
    );
  } catch (error) {
    console.error(
      "[SMSMobileAPI] Error:",
      error.response?.data || error.message
    );
    return false;
  }
}

module.exports = { sendGymSMS };
