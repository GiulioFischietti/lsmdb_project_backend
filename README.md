# **LSMDB - EventinZona**  
A mobile application for discovering and managing local music and party events, integrating web scraping, data analysis, and recommendation systems.  

App Video Demo: https://drive.google.com/file/d/1BHyK2A-uin02X9XYLjEPqV7N6B_5o-EX/view?usp=drive_link

## **Overview**  
EventinZona provides users with real-time event recommendations, reviews, and social features, while offering event organizers and clubs analytics and promotional tools.  

## **Features**  
- **Event Discovery**: Browse local events based on location, genre, and user preferences.  
- **Social Features**: Follow users and entities, like events, and receive personalized recommendations.  
- **Analytics for Organizers**: Insights on club popularity, user reviews, and suggested collaborations.  
- **Automated Web Scraping**: Continuous data retrieval from Facebook and Google Maps.  

## **Data Sources**  
- **Event Data**: Scraped from Facebook event pages.  
- **User & Review Data**: Collected from Google Maps reviews.  
- **Final Dataset**:  
  - 112K Events  
  - 22K Entities (Organizers, Clubs, Artists)  
  - 392K Reviews  
  - 334K Users  

## **Technologies Used**  
- **Backend**: Node.js (Express)  
- **Frontend**: Flutter  
- **Database Management Systems**:  
  - **MongoDB** (NoSQL, document-based storage) for great scalability and speed
  - **Neo4j** (Graph database for social and recommendation features)
- **Web Scraping**: Python-based scripts for continuous data collection  
- **Distributed Database Design**: Sharding and replication for scalability  

![MacBook Air - 1 (1) (1)](https://github.com/user-attachments/assets/eddca1a9-c956-4749-922c-addd6f9e0aef)

## **Database Design**  
- **MongoDB**: Stores events, users, reviews, and analytics data.  
- **Neo4j**: Manages social relationships, user interactions, and event recommendations.  

![eventOrganizersGraph](https://github.com/user-attachments/assets/40115f55-4eb6-4407-8aa8-f1e33607f43d)


## **Data Model**
 - Relational data model
![umlclassdiagram](https://github.com/user-attachments/assets/5cc85b53-db85-489a-82e6-2c4beb4c77bc)


## **Analytics & Insights**  
![image](https://github.com/user-attachments/assets/b3b351be-6615-4cc5-9123-0bee2ae0eaf5)

EventinZona leverages MongoDB and Neo4j to perform advanced analytics, providing valuable insights into event trends, user behaviors, and entity interactions. Key analytics include:  
- **User Rating Analysis**: Identifies the most critical users based on review patterns and ratings.  
- **Entity Performance Metrics**: Evaluates clubs, organizers, and artists using aggregated ratings and user engagement.  
- **Event Popularity Trends**: Analyzes event attendance and user interactions to highlight trending events.  
- **Recommendation System**: Suggests friends, artists, and event collaborations based on user behavior and common interactions.  
- **Review Word Analysis**: Extracts the most frequently used words in user reviews to generate qualitative insights on clubs and events.  
- **Historical Performance Analysis**: Tracks rating trends for entities over time to assess growth and popularity changes.  
