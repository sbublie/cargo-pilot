# CP-Analyzer

CP-Analyzer is a Python application that performs all the necessary calculations to provide added value to the user. A set of operations is carried out every time the user adds new data to the application. These steps are described in the sections below.

## 1. Input Handling

The first step is to handle the raw dataset provided by the user. There are two main ways to feed the data into a running Cargo Pilot instance:

* **Via the customer-facing API**: The API can be used to directly modify the datasets used by Cargo Pilot. The interface description is provided as an [OpenAPI Specification](https://swagger.io/specification/).
* **Via CP-Uploader**: If the data is saved in .csv, .xslx or .geojson format the CP-Uploader program can help with the task of uploading all data contained in the file. More details can be found in the `cp-uploader` subfolder.

Once the data is transmitted to CP-Analyzer via the internet gateway CP-Control Server, it is verified and transferred to internal data objects to enable further processing.

The following data is created here:
* Locations: Simple location a map
* Tours: Cargo tour from location A to B including metadata like load

## 2. Clustering

It is necessary to group the tour locations provided in Cargo Pilot to improve the pattern analysis and enable cluster analysis (more on that later). One of the most common and widely used clustering algorithms is [DBSCAN](https://en.wikipedia.org/wiki/DBSCAN). The results fit the Cargo Pilot's use case as it can identify groups within a large dataset while also being able to find outlier points.

To perform a DBSCAN cluster analysis two parameters are needed:

1. **Epsilon (ε) or the radius**: This parameter determines the neighborhood around each data point. It defines the maximum distance between two points for them to be considered neighbors. Points within this distance are said to be directly reachable. If a point has enough neighbors within its ε-neighborhood, it is considered a core point. The value of ε influences the size and shape of the clusters discovered. A smaller ε will result in more clusters, while a larger ε will merge neighboring clusters into larger ones.
2. **Minimum Points**: This parameter defines the minimum number of points required to form a dense region or cluster. The value influences the algorithm's sensitivity to noise and its ability to differentiate between dense regions and sparse regions. A higher MinPts value will result in fewer clusters and better noise resistance, while a lower MinPts value can create more clusters and be more permissive towards noise.

Currently, the best results are obtained when using all locations to create the clusters. To ensure that CP-Analyzer receives all saved locations from the database to cluster them together with the new data points, this operation requires a significant amount of resources and is triggered only when a substantial amount of new data is received.

The following data is created here:
* Cluster: Set of Locations inclusing metadata like city or region

## 3. Cluster Analysis

With all locations assigned to their respective clusters, it is now possible to analyze the relationship between these clusters. Currently, the number of tours from cluster A to B is counted. This information can be used to create more advanced analyses like a source and sink map in the future.

The following data is created here:
* Cluster Relation: Relation of two clusters including metadata like the amount of load transferred

## 4. Pattern analysis

To identify potential improvements in the amount of cargo transported, it is necessary to analyze the history of recorded tours. The two most important parameters in the current implementation of the pattern analysis are:

* Start time and cluster
* End time and cluster

The algorithm checks if occurrences of the same parameter combination can be found in the database. For example, it can detect the following pattern: Every Thursday afternoon, there is a tour from cluster A to B with an average load of 5%.

The following data is created here:
* Detected Pattern: Repetitive occurrence of a tour with metadata like cluster and time with average load

## 5. Matching of demand and offering

The last step in the data analysis is to combine the detected patterns indicating low capacity utilization with the offerings of an external cargo tour marketplace. In the current implementation, the offerings are predefined but can be pulled automatically via an external API.

The following data is created here:
* Cargo offerings: Available space in a planned cargo tour, including relevant metadata like location and time
* Tour Matches: Detected matches of demand and offering

