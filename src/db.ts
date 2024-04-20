import { Database } from './server';
import { EMPTY_CONTENT_HASH, ETH_COIN_TYPE, GRAPHQL_ENDPOINT, ZERO_ADDRESS } from './utils';

interface User {
  address: string;

}

interface Data {
  users: User[]
}


interface NameData {
  data: Data
}

const query = (handle: string) => ({
  query: `
  {
      users(where: {handle: "${handle}"}) {
          address
      }
  }
  `
});

export const database: Database = {
  async addr(name, coinType) {
    // If the request is for some non-ETH address, return 0x0
    if (coinType !== ETH_COIN_TYPE) {
      return { addr: ZERO_ADDRESS, ttl: 1000 };
    }

    console.log("recieved query for: ", JSON.stringify({ name, coinType }));

    const fetchingName = name.split(".")[0];

    // If the request if for an ETH address, get that from your API (or database directly or whatever)
    try {
      const addr: string = await fetchOffchainName(fetchingName);
      console.log(`addr: for ${name}: `, addr);
      return { addr: addr || ZERO_ADDRESS, ttl: 1000 };
      // return addr || ZERO_ADDRESS;
    } catch (error) {
      console.error('Error resolving addr', error);
      return { addr: ZERO_ADDRESS, ttl: 1000 };
    }
  },
  async text(name: string, key: string) {
    console.log(name, key)
    // If you don't want to use the text records I mentioned like an avatar, just return empty here too
    return ZERO_ADDRESS;
  },
  contenthash() {
    // Realistically you're not going to use this so just return empty
    return EMPTY_CONTENT_HASH;
  },
};

export async function fetchOffchainName(name: string): Promise<string> {

  console.log("fetchOffchainName: ", name);
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(query(name))
    };

    const response = await fetch(GRAPHQL_ENDPOINT, options);

    const data = (await response.json()) as NameData;
    console.log(`response from api for name: ${name}`, JSON.stringify(data));

    return data?.data?.users[0]?.address || ZERO_ADDRESS;
  } catch (err) {
    console.error('Error fetching offchain name', err);
    return ZERO_ADDRESS;
  }
}
