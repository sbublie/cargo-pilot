The route optimization part of Cargo Pilot is designed to solve a [Vehicle Routing Problem (VRP)](https://developers.google.com/optimization/routing).

## Input Parameters

Parameters that can currently be set via the API on every calculation:
- "start_time": The start time of the delivery window. (P0)
- "end_time_incl": The end time (inclusive) of the delivery window. (P0)
- "max_loading_meter": The maximum loading meter capacity for each truck. (P0)
- "max_weight": The maximum weight capacity for each truck. (P0)
- "num_trucks": The number of trucks available for deliveries. (P1)
- "max_travel_distance": The maximum travel distance allowed for each trip. This is equivalent to max. delivery time (P7)

Parameters that are currently set by default:
- Use and location of start depot (-> Coburg)
- [First solution strategy](https://developers.google.com/optimization/routing/routing_options#first_solution_strategy): PARALLEL_CHEAPEST_INSERTION
- [Local search options](https://developers.google.com/optimization/routing/routing_options#local_search_options): GUIDED_LOCAL_SEARCH 
- Maximum time for solution calculation: 5 seconds (influences the quality of the results)

Parameters that are being considered to be set in the future:
- Stackability in the truck cargo area (P2)
- Truck waiting time for consideration of freight delivery (P3)
- Focus of the load optimisation (P4)
- Load carriers "nestability" (P5)
- Next day delivery (P6)

## Step-by-Step Calculation Procedure

Step 1: Filter orders based on the specified time window and valid geo coordinates. Only orders within the given time frame and with valid origin and destination coordinates are considered.

Step 2: Compute a distance matrix representing the distances between all locations.

Step 3: Create a data object that contains all the necessary information for the algorithm

Step 4: Set up the routing model using the [OR-Tools library](https://developers.google.com/optimization/routing/vrp). Define callbacks for distance, weight demand, and loading meter demand. Add constraints for vehicle capacities, distance, and pickup-delivery relationships.

Step 5: Set the solution heuristic and search parameters for solving the VRP. The function uses the Parallel Cheapest Insertion algorithm and Guided Local Search for optimization. A time limit of 5 seconds is set for the solver.

Step 6: Solve the VRP using the specified parameters and obtain the solution.

Step 10: If a solution is found, return a solution to the API caller.

## Solution

The solution provided by the API has three information level:

1. General information like average kilometer
2. List of trips with some trip specific parameter
3. List of trip sections/subtrips