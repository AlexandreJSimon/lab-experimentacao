require('dotenv').config();
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const writer = createCsvWriter({
  path: './relatorio.csv',
  header: [
    {id: 'id', title: 'id'},
    {id: 'name', title: 'name'},
    {id: 'nameWithOwner', title: 'nameWithOwner'},
    {id: 'homepageUrl', title: 'homepageUrl'},
    {id: 'createdAt', title: 'createdAt'},
    {id: 'stargazerCount', title: 'stargazerCount'},
    {id: 'updatedAt', title: 'updatedAt'},
    {id: 'primaryLanguage_name', title: 'primaryLanguage_name'},
    {id: 'releases_totalCount', title: 'releases_totalCount'},
    {id: 'pullRequests_totalCount', title: 'pullRequests_totalCount'},
    {id: 'closeIssues_totalCount', title: 'closeIssues_totalCount'},
    {id: 'totalIssues_totalCount', title: 'totalIssues_totalCount'}
  ]
});

const headers = {
	"content-type": "application/json",
  "Authorization": `bearer ${process.env.PERSONAL_ACCESS_TOKEN}`
};

const graphqlQuery = (after) => {
  return {"query": `{
    search(
      type: REPOSITORY
      first: 30
      query: "stars:>100 sort:stars-desc"
      after: ${after}
    ) {
      edges {
        node {
          ... on Repository {
            id
            name
            nameWithOwner
            homepageUrl
            createdAt
            stargazerCount
            updatedAt
            primaryLanguage {
              name
            }
            releases(orderBy: {field: CREATED_AT, direction: DESC}) {
              totalCount
            }
            pullRequests(states: MERGED) {
              totalCount
            }
            closeIssues: issues(states: CLOSED) {
              totalCount
            }
            totalIssues: issues {
              totalCount
            }
          }
        }
      }
      pageInfo {
        endCursor
      }
    }
  }`};
};

let count = 0;
let endCursor = null;

const getData = async () => {
  let data;
  while(true){
    try{
      await axios
      .post(process.env.GIT_HUB_GRAPHQL_URL, graphqlQuery(endCursor), {
        headers: headers
      })
      .then(res => {
        data = res.data.data.search.edges;
        endCursor = `"${res.data.data.search.pageInfo.endCursor}"`;
        count = count + data.length
        csvWriter(data);
      });
    }catch(err){
      console.log(err);
      break;
    }

    if(count >= process.env.QTD_REPOSITORIES) break;
  }
  console.log(count);
}

const csvWriter = async (data) => {
  let fd = [];
  
  for (let i = 0; i < data.length; i++) {
     fd.push(flattenObj(data[i]['node']))
  }
  await writer.writeRecords(fd)
}

const flattenObj = (obj, parent, res = {}) => {
  for(let key in obj){
      let propName = parent ? parent + '_' + key : key;
      if(typeof obj[key] == 'object'){
          flattenObj(obj[key], propName, res);
      } else {
          res[propName] = obj[key];
      }
  }
  return res;
}

getData()