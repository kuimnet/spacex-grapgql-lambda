const fetch = require("node-fetch");

const endpoint = 'https://api.spacex.land/graphql';

const uniqueSite = "uniqueSite";
const lastHundredLaunches = "last100Launches";

// use local time field for comparison
const queryDistinctSiteName = `
query DistinctSiteName {
    launchesPast(sort: "launch_date_local", order: "desc") {
    id
    launch_date_local
    launch_site {
      site_name
    }
  }
}
`;


// get last 100, therefore, desc by the launch date and limit to 100
const queryLastOneHundred = `
query LastOneHundred {
    launchesPast(limit: 100, sort: "launch_date_utc", order: "desc") {
    id
    mission_name
    launch_date_utc
    rocket {
      rocket_name
      rocket {
        payload_weights {
          lb
          id
          name
        }
        id
      }
    }
  }
}
`;

// Get Distinch Launch Site from Last Years
function distinctLaunchSite(data) {
    let result = [];
    
    // use local time to compare (and obtain local field from graphQL)
    let dateSixYears = new Date();
    dateSixYears.setFullYear(dateSixYears.getFullYear() - 6);
    
    for (let i = 0; i < data.length; i++) {
        let launch = data[i];
        
        // convert to Date; break when it exceed 6 years
        let launchDate = new Date(launch.launch_date_local);
        if (launchDate < dateSixYears) break;
        
        // append the array when it is distinct
        let siteName = launch.launch_site.site_name;
        if (!result.includes(siteName)) result.push(siteName);
    }
    return result;
}

// Get Last 100 Hundreds Launch Ordered by Payload Weights
function lastOneHundredOrdering(data) {
    let result = [];
    data.forEach(launch => {
        let totalPayloads = 0;
        
        // sum up the payload_weights for each rocket in that launch
        if (launch.rocket && launch.rocket.rocket && launch.rocket.rocket.payload_weights) {
            launch.rocket.rocket.payload_weights.forEach(el => totalPayloads += el.lb);
        }
        
        // make an object node for display result
        let node = {
            "id": launch.id,
            "mission_name": launch.mission_name,
            "date": new Date(launch.launch_date_utc),
            "rocket_name": launch.rocket.rocket_name,
            "total_payload_lb": totalPayloads,
        }
        result.push(node)
    })
    
    // sorting by weight
    result.sort((a, b) => {
        return a.total_payload_lb - b.total_payload_lb;
    });
    
    return result;
}

exports.handler = async (event) => {
  
    let action;
    if (event.queryStringParameters) {
        action = event.queryStringParameters.action;
    }
    
    // return bad request when action is not defined
    if (!action) return {"statusCode": 400, "body": "Bad Request, Action Not Provided"};
    
    let querySelected;
    let fnSelected;
    
    // identify which query will be called; return bad request when action is not matched
    if (action === uniqueSite) {
        querySelected = queryDistinctSiteName;
        fnSelected = distinctLaunchSite;
    } else if (action === lastHundredLaunches) {
        querySelected = queryLastOneHundred;
        fnSelected = lastOneHundredOrdering;
    } else {
        return {"statusCode": 400, "body": "Bad Request, Invalid Action"};
    }
    
    // send request to the endpoint
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify({"query": querySelected}),
            headers: { 'Content-Type': 'application/json' }
        });
        const json = await response.json();
        
        let returnBody = fnSelected(json.data.launchesPast);
        
        return {
            "statusCode": 200,
            "body": JSON.stringify(returnBody),
            "headers": {
                "Content-Type": "application/json"
            } 
        }
        
    } catch(e) {
        return e;
    }
};
