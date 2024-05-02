import axios from 'axios';

const url = 'http://18.191.139.125:8080/query/queryNumberOfPapers';

export async function http(request) {
  const response = await axios(request);
  return response.data;
}

export async function put(param) {
  const queryParams = new URLSearchParams(param).toString();
  const fullUrl = `${url}?${queryParams}`;
  console.log(fullUrl);
  return await http({
    method: 'PUT',
    url: fullUrl,
  });
}
