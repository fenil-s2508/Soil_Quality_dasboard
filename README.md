# Soil Quality Monitoring - Dashboard Setup

## Overview
This repository contains the dashboard configuration and visualization setup for an AI-powered IoT Soil Quality Monitoring System. The dashboard is hosted on **ThingSpeak** and provides real-time tracking of critical soil metrics to ensure optimal agricultural health.

## Tracked Parameters
The dashboard visualizes live data streams from the following field sensors:
* **pH Levels**
* **Soil Moisture**
* **Temperature**
* **NPK (Nitrogen, Phosphorus, Potassium)**
* **Electrical Conductivity (EC)**

## Project Context
This dashboard is part of a larger system that bridges IoT hardware with Artificial Intelligence. Data collected here is evaluated using a **Random Forest Classifier** algorithm to predict and analyze overall soil health. 

## How to Replicate This Dashboard
1. Create an account on [ThingSpeak](https://thingspeak.com/).
2. Create a new Channel and set up Fields 1 through 5 for pH, Moisture, Temperature, NPK, and EC.
3. Import your visualization scripts into the ThingSpeak channel's MATLAB Visualizations app.
4. Use your Channel's **Write API Key** in your hardware code to transmit data.
