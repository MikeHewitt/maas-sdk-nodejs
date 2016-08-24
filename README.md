# maas-sdk-nodejs

[![Master Build Status](https://secure.travis-ci.org/miracl/maas-sdk-nodejs.png?branch=master)](https://travis-ci.org/miracl/maas-sdk-nodejs?branch=master)
[![Master Coverage Status](https://coveralls.io/repos/miracl/maas-sdk-nodejs/badge.svg?branch=master&service=github)](https://coveralls.io/github/miracl/maas-sdk-nodejs?branch=master)

* **category**:    SDK
* **copyright**:   2016 MIRACL UK LTD
* **license**:     ASL 2.0 - http://www.apache.org/licenses/LICENSE-2.0
* **link**:        https://github.com/miracl/maas-sdk-nodejs

## Description

NodeJS version of the Software Development Kit (SDK) for MPin-As-A-Service (MAAS).


## Setup

Some dependencies require additional system packages to be installed.
For Ubuntu 14.04 dependencies are:

* `nodejs`
* `build-essential` (for compiling code in dependencies)
* `express` (for running sample app, install by `npm install express --save`)

## Installation

1. Download the source:

   `git clone https://github.com/miracl/maas-sdk-nodejs`

2. Place it under `node_modules` directory of your NodeJS project

3. Run `npm install` from `node_modules/maas-sdk-nodejs` directory to install SDK dependencies


## Tests

After you have finished the installation, run `npm test` from `maas-sdk-nodejs` directory to run tests.

# Miracl API

## Details and usage

All interaction with API happens through 'MiraclClient' instance.

Drop `var MiraclClient = require('maas-sdk-nodejs');` at the top of the file you are going to use `MiraclClient`

Miracl API requires map-like object for storing state and additional data (it should be preserved between calls to api). In this document it is called `session`.

### Initialization

To start using Miracl API, `MiraclClient` should be initialized. It can be done when needed or called before each action e.g. using Express middleware.

```
var miracl = new MiraclClient(
    {client_id: "CLIENT_ID",
    secret: "CLIENT_SECRET",
    redirect_uri: "REDIRECT_URI",
    issuer: "ISSUER"},
    callback);
```
`CLIENT_ID` and `CLIENT_SECRET` can be obtained from Miracl(unique per application). Normally it is not necessary to specify Miracl configuration endpoint to MiraclClient but it can be done by passing `issuer: "ISSUER"` along with `client_id`, `secret` and `redirect_uri` to `MiraclClient`. `REDIRECT_URI` is URI of your application end-point that will be responsible obtaining token. It should be the same as registered in Miracl system for this client ID.

To check if user session has token use `miracl.isAuthorized(session)`. You can request additional user data with `miracl.getEmail(session)` and `miracl.getUserID(session)`. Both methods cache results into `session`. If `nil`  is returned, token is expired and client needs to be authorized once more to access required data.

Miracl API sets keys and values to session in JavaScript object manner. For example, `session.miraclState = "random_string"` If your session middleware does not support this approach, you have to synchronize app's session with JavaScript object passed to Miracl API functions. It has to be done before and after every Miracl API function call which require session passed as function argument. List of [compatible session stores](https://github.com/expressjs/session#compatible-session-stores).

Use `miracl.clearUserInfo(session)` to drop cached user data (e-mail and user id).

Use `miracl.clearUserInfo(session, true)` to clear user authorization status.

### Authorization flow

Authorization flow depends on `mpad.js` browser library. To use it, drop following line
```
<script src="https://dd.cdn.mpin.io/mpad/mpad.js" data-authurl="<%=auth_url%>" data-element="btmpin"></script>
```
right before closing `</body>` tag. And drop
```
<div id="btmpin"></div>
```
in the desired location of "Login with M-Pin" button.

If user is not authorized, use `miracl.getAuthorizationRequestUrl(session)` to get authorization request URL and set client internal state. Returned URL should be passed to `data-authurl` attribute like `data-authurl="<%=auth_url%>"`. After user interaction with Miracl system user will be sent to `redirect_uri` defined at initialization of `MiraclClient` object.

To complete authorization pass params object received on `redirect_uri` to `miracl.validateAuthorization(params, callback)`. When access token and userinfo request will be done, passed `callback` function will be called using two arguments - error(`null` on successful request, instance of MiraclError otherwise) and accessToken if authorization succeeded. accessToken is preserved in `session` so there is no need to save token elsewhere.

### Problems and exceptions

Each call to `MiraclClient` can raise `MiraclError`. It contains `message` and sometimes original error message raised by OAuth2 or any other dependent npm package. Usually `MiraclError` is raised when API call can't continue and it's best to redirect user to error page if `MiraclError` is raised. `MiraclError` can contain helpful messages when debugging.

## Samples

Sample on Express can be found in the `samples` directory. In order to start server, do steps written below:

1. Move `samples` folder outside of the `maas-sdk-nodejs` directory

2. Run `npm install` from `samples` directory to install sample app's dependencies

3. Run `npm install` from `maas-sdk-nodejs` directory to install SDK dependencies. Tests can be run with `npm test` inside SDK folder once all dependencies are installed.

4. Place entire `maas-sdk-nodejs` folder under `samples/node_modules` so the path to SDK looks like `./samples/node_modules/maas-sdk-nodejs`

5. Replace `CLIENT_ID`, `CLIENT_SECRET` located in `samples/sample.json` with valid data.

6. Run `node app.js` from `samples` directory to start server

7. Open `http://127.0.0.1:5000/` in your browser to explore the sample.
