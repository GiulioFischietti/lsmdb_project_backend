# **EventinZona**  
A mobile application for discovering and managing local music and party events, integrating web scraping, data analysis, and recommendation systems.  

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
  - **MongoDB** (NoSQL, document-based storage)  
  - **Neo4j** (Graph database for social and recommendation features)  
- **Machine Learning & NLP**: Used for data analysis and recommendations  
- **Web Scraping**: Python-based scripts for continuous data collection  
- **Distributed Database Design**: Sharding and replication for scalability  

## **Database Design**  
- **MongoDB**: Stores events, users, reviews, and analytics data.  
- **Neo4j**: Manages social relationships, user interactions, and event recommendations.  
