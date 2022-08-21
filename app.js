require('dotenv').config();
const axios = require('axios');

const headers = {
	"content-type": "application/json",
  "Authorization": `bearer ${process.env.PERSONAL_ACCESS_TOKEN}`
};

const graphqlQuery = {
  "query": `{
    search(type: REPOSITORY, first: 30, query: "stars:>1000 sort:stars-desc") {
      edges {
        node {
          ... on Repository {
            id
            name
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
    }
  }`,
};

axios
  .post(process.env.GIT_HUB_GRAPHQL_URL, graphqlQuery, {
    headers: headers
  })
  .then(res => {
    console.log(`statusCode: ${res.status}`);
    console.log(res.data);
  })
  .catch(error => {
    console.error(error);
  });