### Introduction


Here, we present Virus Genome Viewer (VGV), a comprehensive viral genome visualization system, which can visualize genome sequences and structrue annotations of a variety of viruses in an intuitive, friendly and convenient form. It can perform online comparison of virus multi-genome sequences, display homologous segments, and show the genetic relationship between virus sequences through the phylogenetic tree. The system also collected sequence data of variant SARS-CoV-2 strains, and realized the visualization of SARS-CoV-2 sequence evolution in time sequence based on the clades.

<div align=center>
 <img width="500" alt="image" src="https://user-images.githubusercontent.com/35963630/223033317-ef713c18-60c1-4c38-89a4-00d7232898de.png">
</div>

> (a) Header: displays the header information;
> (b) Sidebar: used to switch between different types of visualization operations or view help documents, contact information and other information;
> (c) Title: display the subject sequence information such as the species name viewed by the current user;
> (d) Toolbar: Help links are set at the left end, and navigation functions such as translation, jump, zooming and zooming of the genome browser are arranged in the center. Track and time order management controls are set at the right end;
> (e-g) Data visualization area: this area is the main part of each visualization module of the system, as shown in the figure. The visualization forms of the single genome visualization module (Figure 3-2e), the multi virus sequence alignment module (Figure 3-2f) and the COVID-19 evolution visualization module (Figure 3-2g) are different;
> (h) Footer: display system copyright and contact information.

### Methods

All viral genomics data can be obtained from public databases. Virus reference sequences and gene annotations were from NCBI GenBank (https://www.ncbi.nlm.nih.gov/nuccore), and protein sequences and annotations were from UniProt Proteomes (https://www.uniprot.org/proteomes/). SARS-CoV-2 variant strain sequences were collected from GISAID (https://www.gisaid.org/).

The reference genes and annotations of each species were preprocessed into JSON files, which were stored together with species identification, which saved time for format conversion. More complicated SARS-CoV-2 strain sequence data was hosted in a PostgreSQL 9.6.22 cluster for management after aligning and compressing the sequence data of each strain with the reference genome sequence, and efficient indexes was used to ensure high availability and load balance.

### Design

The system was designed into three functional modules to perform visual analysis with different functional characteristics for viral genomes: 1) Display the genome data of a specific virus in the form of a genome browser, including information such as nucleotide sequences, genes, protein codes and other structure annotations. 2) Perform multiple sequence alignments according to the sequence selected by the user, visualize the structure, site variation and sequence similarity between the genome sequences of different species, and show the genetic relationship in a phylogenetic tree. 3) According to the genome sequence of variant SARS-CoV-2 strains selected by the user, the analysis results of sequence variation and sequence diversity within each clade are displayed in time sequence.

### Implemention

The system adopted B/S(Browser/Server) structure. Java Spring Boot open source component was chosen for the server implementation, which used Apache Tomcat 8 as Java application server to deploy the web archive (war file) with the RESTful web services API implementation. MyBatis 3 was chosen to connect to PostgreSQL, and Thymeleaf was used to render front-end Web pages. Various objects were divided into three levels: Model, View, and Controller according to their functions. All user operations would eventually be fed back to the data model in real time, and then the changes will be displayed after the data in the model changed.

The idea of front-end and back-end separation runs through application development. Client uses Ajax to send asynchronous GET requests to the server to obtain genome data, and caches the transmitted data locally to avoid requesting the same data again during range selection and other operations. The data integrated in the viral genome visualization system is deployed on the server side, and the data visualization is realized in a distributed manner on the user side through a Web browser. Therefore, the server only needs to perform data storage management and retrieval, and the load is lighter, and smooth services can be provided even when a large number of users are concurrently accessing it. 

 ## Details
 
<div align=center>
 <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223034764-d7e00cb1-6391-46af-8ed3-14179c3cc10b.png">
  <p>Display strategy of reference genome sequence at different scales</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223034905-f10c844a-62af-4dee-9367-11f6ba8e8f09.png">
<p>Reference gene track</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035071-e1a830e2-6507-4bbd-b3c2-f177128734ea.png">
  <p>Display strategy of protein annotation at different scales</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035135-7bd123dc-649e-429d-9c69-3d92b5b9d55b.png">
  <p>Visualization effect of protein domain</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035216-b64c7b0d-b264-43b6-9649-568bf5bc992b.png">
  <p>Visual species genome selection interface</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035287-dfcddbea-9d38-424c-9c80-704a0cc9a83a.png">
  <p>Comparison of transcriptional regulatory sequence and reference gene in coronavirus</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035355-1be65591-2406-425b-a3f6-be62463813f6.png">
  <p>Base level display of multiple sequence alignment</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035407-5bc2fa07-b829-4689-b740-1f8c7eb972c8.png">
  <p>Comparison sequence site similarity display</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035475-d65e8f30-ee08-4d8c-820c-33e6dfae2372.png">
  <p>Multi-sequence evolutionary relationship tree rendering</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035545-631dc915-771b-4ee0-b6b3-e38fbee6718b.png">
  <p>COVID-19 strain selection interface</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035604-4a2311fc-82e7-44f3-adcf-78eb1cc2b3de.png">
  <p>Display of variation of COVID-19 strain</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035663-8f64976a-5e85-407e-b685-3f03eaf658c0.png"><br>
<img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035672-98f8a235-3e1b-463d-9c59-75314362f187.png"><br>
<img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035687-5bab4ead-9d48-4b77-b6a2-cc67e61e97a5.png"><br>
<img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035699-1378bcdc-5294-4c0f-8e39-e900abd5b5b7.png"><br>
  <p>Visualization of sequence variation time sequence of each evolutionary branch of COVID-19</p><br>
  <img width="600" alt="image" src="https://user-images.githubusercontent.com/35963630/223035787-752fee65-4aab-44c8-b14b-ec6bed37aba5.png">
  <p>Evolutionary tree of COVID-19 strains in Full mode</p><br>
  
</div>
 
 
