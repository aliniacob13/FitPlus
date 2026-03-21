# FitPlus

FitPlus is designed to be an app that monitors a user's physical activity and nutrition, as well as storing all the details about gyms (name, location, prices, classes)
in the vecinity.

The app has been thought as a solution for the following user stories:
1. As a user, I want to view a map of gyms near my current location so that I can find a convenient place to work out.
2. As a user, I want to see details about a gym, like opening hours, available equipment, when clicking on it on the map.
3. As a user, I want to get gym recommandations based on criteria, so I can choose the one that fits me best.
4. As a user, I want to manage and purchase my gym membership directly from the app.
5. As a user, I want the app to create a personalized profile that fits my goals, as well as personal information.
6. As a user, I want the app to recommend diets and personalized workouts that fit my profile.
7. As a user, I want an AI Agent to tell me which exercises work better for a specific muscle group.
8. As a user, I want the AI Agent to recommend me step-by-step workouts based on my requests on that day.
9. As a user, I want the AI to also be able to adjust my workout based on my energy levels and fitness capabilities.
10. As a user, I want to store my weight goals and restrictions directly into the app.
11. As a user, I want to get suggestions of meals from a specific AI, so that I may achieve my goals.
12. As a user, I want the AI to generate a list of groceries that will give me the exact nutrients necessary for my workout sessions.
13. As another or maybe the same user, I want to be able to save to a list of favorites the gyms I visit frequently.
14. Of course, I would like to also leave a review and pictures of the gyms.
15. I want the fitness AI to remember my previous workouts so that it can progressively increase the difficulty.
16. As a user (of course), I want to tell my diet AI about my food preferences, allergies and budget so that it can recommend me suitable meals.
17. I want to be able to also upload health prescriptions, given to me by a nutritionist, so that the AI knows exactly what type of diet I need.

After looking at the user stories, and given the fact that we are five students in the team, we have divided the backlog to look like this:
1. We have decided to work with PythonAPI, so setting it up would be the first step. It is divided in 3: the Router, which waits for the HTTP requests and
sends back the responses, the Service (the functions that the app needs to have) and the Model (the actual data)
2. Set up a database
3. Implement a registering function (log in + sign in)
4. Setting up the framework - React Native, combined with Typescript to catch errors
5. Setting up the Navigation Tab Bar
6. Set up a global state management library for the transmission of information
7. Build the UI for the app
8. Create the Gym database that includes location (using PostGIS)
9. Build the /api/gyms/nearby endpoint that takes a user's latitude/longitude and uses PostGIS (ST_Distance) to return the closest gyms
10. Set up Stripe in the backend and build the endpoint to generate a checkout session
11. Create the Subscriptions database table to link a user ID to their subscriptions
12. Integrate a map library (react-native maps) and request user location permissions
13. Connect the map screen to the /api/gyms/nearby and fix pins on the map for each gym.
14. Build the gym details that appear when a user clicks on a pin.
15. UI for subscription and price page.
16. Integrate the frontend payment so that the user's UI is updated when the subscription is active.
17. Set up the LLM provider in the FastAPI backend.
18. Train the AI Agents for their tasks (workout trainer and diet councilor)
19. Create a history database, so that the AI remembers the previous preferences of its user.
20. Build a UI component for these chats and connect them to the backend.
21. (MAYBE) Add a waiting state (...) while waiting for the AI to answer.


Students:

Crudu Razvan 
Dragunoi Miruna
Iacob Alin
Panaet Alexandra
Porof Ioana
