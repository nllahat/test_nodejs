import { Request, Response, NextFunction } from "express";
import { UserPreferences } from "../models/userPreferences";
import { TripSettings } from "../models/tripSettings";
import * as GoogleMaps from "@google/maps";

/**
 * GET /
 * Home page.
 */
export const index = (req: Request, res: Response) => {
  res.render("home", {
    title: "Home"
  });
};

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  const googleMapsClient = GoogleMaps.createClient({
    key: "asdasdasda"
  });

  const bodyUserPreferences = req.body.userPreferences;
  const bodyTripSettings = req.body.tripSettings;

  const userPreferences: UserPreferences = new UserPreferences(
    bodyUserPreferences.museums,
    bodyUserPreferences.sights,
    bodyUserPreferences.shopping
  );

  const tripSettings: TripSettings = new TripSettings(
    bodyTripSettings.days,
    bodyTripSettings.city,
    bodyTripSettings.mainActivitiesPerDay
  );

  const museums: GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse> = await googleMapsClient
    .places({
      query: "museums " + tripSettings.City
    })
    .asPromise();
  const sights: GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse> = await googleMapsClient
    .places({
      query: "sights " + tripSettings.City
    })
    .asPromise();
  const shopping: GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse> = await googleMapsClient
    .places({
      query: "shopping " + tripSettings.City
    })
    .asPromise();
  res.status(200).end();
};
