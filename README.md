### Introduction

Here, we present Virus Genome Viewer (VGV), a comprehensive viral genome visualization system, which can visualize genome sequences and structrue annotations of a variety of viruses in an intuitive, friendly and convenient form. It can perform online comparison of virus multi-genome sequences, display homologous segments, and show the genetic relationship between virus sequences through the phylogenetic tree. The system also collected sequence data of variant SARS-CoV-2 strains, and realized the visualization of SARS-CoV-2 sequence evolution in time sequence based on the clades.

### Methods

All viral genomics data can be obtained from public databases. Virus reference sequences and gene annotations were from NCBI GenBank (https://www.ncbi.nlm.nih.gov/nuccore), and protein sequences and annotations were from UniProt Proteomes (https://www.uniprot.org/proteomes/). SARS-CoV-2 variant strain sequences were collected from GISAID (https://www.gisaid.org/).

The reference genes and annotations of each species were preprocessed into JSON files, which were stored together with species identification, which saved time for format conversion. More complicated SARS-CoV-2 strain sequence data was hosted in a PostgreSQL 9.6.22 cluster for management after aligning and compressing the sequence data of each strain with the reference genome sequence, and efficient indexes was used to ensure high availability and load balance.

### Design

The system was designed into three functional modules to perform visual analysis with different functional characteristics for viral genomes: 1) Display the genome data of a specific virus in the form of a genome browser, including information such as nucleotide sequences, genes, protein codes and other structure annotations. 2) Perform multiple sequence alignments according to the sequence selected by the user, visualize the structure, site variation and sequence similarity between the genome sequences of different species, and show the genetic relationship in a phylogenetic tree. 3) According to the genome sequence of variant SARS-CoV-2 strains selected by the user, the analysis results of sequence variation and sequence diversity within each clade are displayed in time sequence.

### Implemention

The system adopted B/S(Browser/Server) structure. Java Spring Boot open source component was chosen for the server implementation, which used Apache Tomcat 8 as Java application server to deploy the web archive (war file) with the RESTful web services API implementation. MyBatis 3 was chosen to connect to PostgreSQL, and Thymeleaf was used to render front-end Web pages. Various objects were divided into three levels: Model, View, and Controller according to their functions. All user operations would eventually be fed back to the data model in real time, and then the changes will be displayed after the data in the model changed.

The idea of front-end and back-end separation runs through application development. Client uses Ajax to send asynchronous GET requests to the server to obtain genome data, and caches the transmitted data locally to avoid requesting the same data again during range selection and other operations. The data integrated in the viral genome visualization system is deployed on the server side, and the data visualization is realized in a distributed manner on the user side through a Web browser. Therefore, the server only needs to perform data storage management and retrieval, and the load is lighter, and smooth services can be provided even when a large number of users are concurrently accessing it. 