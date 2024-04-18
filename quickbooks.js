require("dotenv").config();
const axios = require('axios');
const qs = require('qs');

// Function to obtain OAuth2 access token
async function getToken(authCode) {
  const clientId = process.env.CLIENTID;
  const clientSecret = process.env.CLIENTSECRET;
  const redirectUri = process.env.REDIRECT_URI;

  const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens';

  const postData = {
    grant_type: process.env.AUTHORIZATION_CODE,
    code: authCode,
    redirect_uri: redirectUri
  };

  const authHeader = {
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  try {
    const response = await axios.post(tokenEndpoint, qs.stringify(postData), {
      headers: authHeader
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error obtaining access token:', error.response.data);
    throw error;
  }
}

// Function to fetch reports using access token
async function getReports(token) {
  const reportsEndpoint = 'https://quickbooks.api.intuit.com/v3/reports';

  const headers = {
    Authorization: `Bearer ${token}`
  };

  try {
    const response = await axios.get(reportsEndpoint, {
      headers
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error.response.data);
    throw error;
  }
}

module.exports = { getToken, getReports };
