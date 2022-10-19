require('dotenv').config();
const repos = require('./repos.json');
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;



const headers = {
	"content-type": "application/json",
  "Authorization": `bearer ${process.env.PERSONAL_ACCESS_TOKEN}`
};

const graphqlQuery = (name, login, after) => {
  return {"query": `{
    repository(name: "${name}", owner: "${login}") {
      pullRequests(states: [CLOSED, MERGED], first: 100, after: ${after}) {
        edges {
          node {
            additions
            deletions
            reviews {
              totalCount
            }
            closedAt
            createdAt
          }
        }
        pageInfo {
          endCursor
        }
      }
    }
  }`};
};

let count = 0;
let endCursor;
let writer;

const getData = async () => {
  let data;
  for(i = 0; i < repos.edges.length; i++){
    writer = createCsvWriter({
      path: `./arquivo_${repos.edges[i].node.name}.csv`,
      header: [
        {id: 'additions', title: 'additions'},
        {id: 'deletions', title: 'deletions'},
        {id: 'reviews_totalCount', title: 'reviews_totalCount'},
        {id: 'closedAt', title: 'closedAt'},
        {id: 'createdAt', title: 'createdAt'},
      ]
    });
    console.log(`######################## ${repos.edges[i].node.name} ########################`);
    endCursor = null;
    while(true){
      try{
        await axios
        .post(process.env.GIT_HUB_GRAPHQL_URL, graphqlQuery(repos.edges[i].node.name, repos.edges[i].node.owner.login, endCursor), {
          headers: headers
        })
        .then(res => {
          data = res.data.data.repository.pullRequests.edges;
          endCursor = `"${res.data.data.repository.pullRequests.pageInfo.endCursor}"`;
          count = count + data.length
          csvWriter(data);
        });
      }catch(err){
        console.log(err);
        break;
      }
      
      await sleep(800)

      console.log(`loading ${count}....`);
    }
  }
  console.log(count);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
