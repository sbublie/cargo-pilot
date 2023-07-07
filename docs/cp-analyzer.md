# CP-Analyzer

CP-Analyzer is the project component that performs all the calculations necessary to link a freight offer and empty journey pattern. The steps that are required to provide a meaningful result are listed below.

## Input Handling

The first step is to handle the raw data set that is provided by the user. There are two main ways to feed the data into a running Cargo Pilot instance:

* **Via the customer-facing API**: The API can be used to directly modify the datasets used by Cargo Pilot. The interface description is provided as an [OpenAPI Specification](https://swagger.io/specification/).
* **Via CP-Uploader**: If the data is saved in .csv, .xslx or .geojson format the CP-Uploader program can help with the task of uploading all data contained in the file. More details can be found in the `cp-uploader` subfolder.

## Clustering

It is necessary to group the tour locations provided in Cargo Pilot to improve the pattern analysis and to enable a cluster analysis (more on that later). One of the most common and widely used clustering algorithm is [DBSCAN](https://en.wikipedia.org/wiki/DBSCAN). The results fit the Cargo Pilot's use case as it can identify groups within a large set of data while it's also able to find outlier points.

To perform a DBSCAN cluster analysis two parameters are needed:

1. **Epsilon (ε) or the radius**: This parameter determines the neighborhood around each data point. It defines the maximum distance between two points for them to be considered neighbors. Points within this distance are said to be directly reachable. If a point has enough neighbors within its ε-neighborhood, it is considered a core point. The value of ε influences the size and shape of the clusters discovered. A smaller ε will result in more clusters, while a larger ε will merge neighboring clusters into larger ones.&#x20;
2. **Minimum Points**: This parameter defines the minimum number of points required to form a dense region or cluster. The value influences the algorithm's sensitivity to noise and its ability to differentiate between dense regions and sparse regions. A higher MinPts value will result in fewer clusters and better noise resistance, while a lower MinPts value can create more clusters and be more permissive towards noise.

Both parameters need to be adapted to the use case and it's individual data points.&#x20;

## Cluster Analysis

With all locations assigned to thier respective cluster it's now possible to analyse the relation between these clusters.&#x20;

## Key data points

