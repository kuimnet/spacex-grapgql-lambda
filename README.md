# spacex-grapgql-lambda

It is the lambda function for obtaining data from SpaceX GraphQL API.

### Prerequisite
* The runtime of this lambda function is nodejs14.x
* Adding Lambda Layer on "graphql-request" at nodejs14.x runtime

### 2 Queries in the function.
* Get unique launch_site locations from the last 6 years
* Get an array of the last 100 launches ordered by payload weight

Only Get Reuqest allow, with proper query string. The query string must contain "action" as key, its value either "uniqueSite" or "last100Launches". Otherwise, bad request will be returned.

