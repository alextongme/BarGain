# BarGain
## Live Link
http://tongsalex.com/bargain

## Introduction
![alt text](wireframes/bargain.png)
### 'The only bar that doesn't sell alcohol.'
My very first full-stack application. Buy and sell items from thousands of users all geolocated around you. Below is a readme.md file with explanations of the technologies used, the approach taken, installation instructions, unsolved problems, etc. 

## User Story
- Search for active listings in the search bar which will pull up a map that centers around you. 
- You have the option of "watching" items that are currently active, to see if their prices changes or any item details change.
- Or, if you prefer to sell something, click on the "BarSell" tab. 
- Fill out the new listing form. 
- Your new listing will show on the all listings page, the search listings page, and your personal account page. 
- You also have the option to edit or delete your listing if you should need to change it via your personal account page.
- Buy and sell away!


## Approach Taken
Started by learning and experimenting with Google Maps API manipulation. Then, I implemented the users signup/login forms courtesy of [Bobby King](https://github.com/gittheking) at General Assembly. 

## Deployed Link
[BarGain](https://www.bar-gain.herokuapp.com "BarGain")

### Technologies Used
"eslint": "^3.8.1"  
"bcryptjs": "^2.3.0"  
"body-parser": "^1.15.2"  
"cookie-parser": "^1.4.3"  
"crypto": "0.0.3"  
"dotenv": "^2.0.0"  
"ejs": "^2.5.2"  
"express": "^4.14.0"  
"express-session": "^1.14.1"  
"method-override": "^2.3.6"  
"mongodb": "^2.2.11"  
"morgan": "^1.7.0"  
"node-fetch": "^1.6.3"  
"path": "^0.12.7"

HTML  
CSS  
Javascript/Jquery  
Google Maps API  

### Installation Instructions
```bash
npm install
```

### Unsolved Problems/Future Work
Finish CSS styling.
Adjust users' ability to see favorites on their account page.
Add abilities to upload pictures of items.

### Wireframes
#### Title Page
![alt text](wireframes/1.png)
#### Login Page
![alt text](wireframes/2.png)
#### Signup Page
![alt text](wireframes/3.png)
#### Deciding Page
![alt text](wireframes/4.png)
#### All Listings Page w/ Google Map Markers
![alt text](wireframes/5.png)
#### New Listing Page
![alt text](wireframes/6.png)
#### Search Results Page
![alt text](wireframes/7.png)
