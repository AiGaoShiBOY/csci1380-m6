import axios from 'axios';

// we have to use the proxy approach (relative url) to bypass the CORS error
const endpoint = '/query/queryNumberOfPapers';

export async function http(request) {
  const response = await axios(request);
  return response.data;
}

export async function put(param) {
  const queryParams = new URLSearchParams(param).toString();
  const fullUrl = `${endpoint}?${queryParams}`; // use the relative url path
  console.log(fullUrl);
  return await http({
    method: 'PUT',
    url: fullUrl,
    data: {}, // the body of the PUT request; must be present or node will fail
  });
}
