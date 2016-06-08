# Setup

## Installation

1. Download the source:

   `git clone https://github.com/miracl/maas-sdk-nodejs`

2. Drop it under `node_modules` folder
3. And run `npm install` from your project's root


## Tests

To run tests change directory by `cd maas-sdk-nodejs`

And run `npm test` to run tests.

# Miracl API

## Details and usage

All interaction with API happens through 'MiraclClient' instance.

Drop `var MiraclClient = require('./node_modules/maas-sdk-nodejs/lib/index');` at the top of the file you are going to use `MiraclClient`

Miracl API requires map-like object for storing state and additional data (it should be preserved between calls to api). In this document it is called `session`.

### Initialization

To start using Miracl API, `MiraclClient` should be initialized. It can be done when needed or called before each action e.g. using Express midleware.

```
var miracl = new MiraclClient(
    {clientID: "CLIENT_ID",
    clientSecret: "CLIENT_SECRET",
    callbackURL: "REDIRECT_URI"},
    callback);
```
`CLIENT_ID` and `CLIENT_SECRET` can be obtained from Miracl(unique per application). `REDIRECT_URI` is URI of your application end-point that will be responsible obtaining token. It should be the same as registered in Miracl system for this client ID.

To check if user session has token use `miracl.isAuthorized(session)`. You can request additional user data with `miracl.getEmail(session)` and `miracl.getUserID(session)`. Both methods cache results into `session`. If `nil`  is returned, token is expired and client needs to be authorized once more to access required data.

Miracl API sets keys and values to session in JavaScript object manner. For example, `session.miraclState = "random_string"` If your session middleware does not support this approach, you have to synchronize app's session with JavaScript object passed to Miracl API functions. It has to be done before and after every Miracl API function call which require session passed as function argument. List of [compatible session stores] (https://github.com/expressjs/session#compatible-session-stores/).

Use `miracl.clearUserInfo(session)` to drop cached user data (e-mail and user id).

Use `miracl.clearUserInfo(session, true)` to clear user authorization status.

### Authorization flow

Authorization flow depends on `mpad.js` browser library. To use it, drop following line
```
<script src="https://demo.dev.miracl.net/mpin/mpad.js" x-authurl="<%=auth_url%>" x-element="btmpin"></script>
```
right before closing `</body>` tag. And drop
```
<div id="btmpin"></div>
```
in the desired location of "Login with M-Pin" button.

If user is not authorized, use `miracl.getAuthorizationRequestUrl(session)` to get authorization request URL and set client internal state. Returned URL should be passed to `x-authurl` attribute like `x-authurl="<%=auth_url%>`. After user interaction with Miracl system user will be sent to `redirect_uri` defined at initialization of `MiraclClient` object.

To complete authorization pass params object received on `redirect_uri` to `miracl.validateAuthorization(params, cb)`. When access token and userinfo request will be done, passed `cb` function will be called using two arguments - error(`null` on successful request, instance of MiraclError otherwise) and accessToken if authorization succeeded. accessToken is preserved in `session` so there is no need to save token elsewhere.

### Problems and exceptions

Each call to `MiraclClient` can raise `MiraclError`. It contains `message` and sometimes original error message raised by OAuth2 or any other dependent npm package. Usually `MiraclError` is raised when API call can't continue and it's best to redirect user to error page if `MiraclError` is raised. `MiraclError` can contain helpful messages when debugging.

## Samples

Sample on Express can be found in the `samples` directory. Replace `CLIENT_ID`, `CLIENT_SECRET` and `REDIRECT_URI` with valid data from https://m-pin.my.id/protected
Do steps written in `Installation` and run `npm install` to install all dependencies.

To start server,
`cd samples/express_sample` && `node app.js`.

Open `http://127.0.0.1:5000/` in your browser to explore the sample.
