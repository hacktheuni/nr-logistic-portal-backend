import axios from 'axios'
import axiosRetry from 'axios-retry'

const DEFAULT_TIMEOUT = 15000;

const HERMES_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
  'Content-Type': 'application/json',
  'Origin': 'https://localhost',
  'Referer': 'https://localhost/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'cross-site',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 14; sdk_gphone64_x86_64 Build/UE1A.230829.050; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.5672.136 Mobile Safari/537.36',
  'X-Requested-With': 'com.hermescourier.app'
};

const COGNITO_HEADERS = {
  'authority': 'cognito-idp.eu-west-1.amazonaws.com',
  'accept': '*/*',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'max-age=0',
  'content-type': 'application/x-amz-json-1.1',
  'origin': 'https://localhost',
  'referer': 'https://localhost/',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
  'user-agent': 'Mozilla/5.0 (Linux; Android 14; sdk_gphone64_x86_64 Build/UE1A.230829.050; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.5672.136 Mobile Safari/537.36',
  'x-amz-user-agent': 'aws-amplify/5.0.4 js',
  'x-requested-with': 'com.hermescourier.app'
};

export const createHermesClient = () => {
  const client = axios.create({
    baseURL: 'https://api.hermesworld.co.uk',
    timeout: DEFAULT_TIMEOUT,
    headers: HERMES_HEADERS
  })

  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
  })

  return client
}

export const createCognitoClient = (target: string) => {
  const client = axios.create({
    baseURL: 'https://cognito-idp.eu-west-1.amazonaws.com',
    timeout: DEFAULT_TIMEOUT,
    headers: {
      ...COGNITO_HEADERS,
      'x-amz-target': `AWSCognitoIdentityProviderService.${target}`
    }
  })

  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay
  })

  return client
}

export const createEvriClient = (token: string) => {
  const client = axios.create({
    baseURL: 'https://courier-availability.api.evri.com',
    timeout: DEFAULT_TIMEOUT,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-requested-with': 'com.hermescourier.app'
    }
  })

  return client
}

