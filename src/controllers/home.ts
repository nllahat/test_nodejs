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
    Promise: Promise,
    key: "AIzaSyDYaVhAvMrNzI5UxA0vinTsJ2kZxb_tTkk"
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

  try {
    const searchPlacesResults: [
      GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse>,
      GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse>,
      GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse>
    ] = await Promise.all([
      googleMapsClient
        .places({
          query: "museums " + tripSettings.City
        })
        .asPromise(),
      googleMapsClient
        .places({
          query: "sights " + tripSettings.City
        })
        .asPromise(),
      googleMapsClient
        .places({
          query: "shopping " + tripSettings.City
        })
        .asPromise()
    ]);

    const museums: GoogleMaps.PlaceSearchResult[] = searchPlacesResults[0].json.results;
    const sights: GoogleMaps.PlaceSearchResult[] = searchPlacesResults[1].json.results;
    const shopping: GoogleMaps.PlaceSearchResult[] = searchPlacesResults[2].json.results;

    const numberOfMainActivitiesMuseums = UserPreferences.calculateNumOfMainActivities(
      UserPreferences.categoryNumberOfActivities(
        tripSettings.TotalHours,
        tripSettings.UsuallySpent.museums,
        userPreferences.Museums
      ),
      userPreferences.Museums
    );
    const numberOfMainActivitiesSights = UserPreferences.calculateNumOfMainActivities(
      UserPreferences.categoryNumberOfActivities(
        tripSettings.TotalHours,
        tripSettings.UsuallySpent.sights,
        userPreferences.Sights
      ),
      userPreferences.Sights
    );
    const numberOfMainActivitiesShopping = UserPreferences.calculateNumOfMainActivities(
      UserPreferences.categoryNumberOfActivities(
        tripSettings.TotalHours,
        tripSettings.UsuallySpent.shopping,
        userPreferences.Shopping
      ),
      userPreferences.Shopping
    );

    const topMuseums = museums.slice(0, numberOfMainActivitiesMuseums);
    const otherMuseums = museums.slice(
      numberOfMainActivitiesMuseums,
      UserPreferences.categoryNumberOfActivities(
        tripSettings.TotalHours,
        tripSettings.UsuallySpent.museums,
        userPreferences.Museums
      )
    );

    const topShoppings = shopping.slice(0, numberOfMainActivitiesShopping);
    const otherShoppings = shopping.slice(
      numberOfMainActivitiesShopping,
      UserPreferences.categoryNumberOfActivities(
        tripSettings.TotalHours,
        tripSettings.UsuallySpent.shopping,
        userPreferences.Shopping
      )
    );

    const topSights = sights.slice(0, numberOfMainActivitiesSights);
    const otherSights = sights.slice(
      numberOfMainActivitiesSights,
      UserPreferences.categoryNumberOfActivities(
        tripSettings.TotalHours,
        tripSettings.UsuallySpent.sights,
        userPreferences.Sights
      )
    );
    const results = {
      museums: {
        top: topMuseums,
        other: otherMuseums
      },
      shopping: {
        top: topShoppings,
        other: otherShoppings
      },
      sights: {
        top: topSights,
        other: otherSights
      }
    };

    interface InterfaceMap {
      [k: string]: GoogleMaps.PlaceSearchResult;
    }
    const fromMap: InterfaceMap = {};
    const toMap: InterfaceMap = {};
    const points = [...topMuseums, ...otherMuseums, ...topShoppings, ...otherShoppings, ...topSights, ...otherSights];
    const fromPoints = points.slice(0, Math.round(points.length / 2));
    const toPoints = points.slice(Math.round(points.length / 2), points.length);

    for (const point of fromPoints) {
      fromMap[point.place_id] = point;
    }
    for (const point of toPoints) {
      toMap[point.place_id] = point;
    }

    const fromStrArr = fromPoints.map(mus => [mus.geometry.location.lat, mus.geometry.location.lng].join(","));
    const toStrArr = toPoints.map(mus => [mus.geometry.location.lat, mus.geometry.location.lng].join(","));
    const fromPointsStr: GoogleMaps.LatLng[] = [fromStrArr.join("|")];
    const toPointsStr: GoogleMaps.LatLng[] = [toStrArr.join("|")];

    try {
      const result: GoogleMaps.ClientResponse<GoogleMaps.DistanceMatrixResponse> = await googleMapsClient
        .distanceMatrix({
          mode: "walking",
          origins: fromPointsStr,
          destinations: toPointsStr
        })
        .asPromise();

      for (let i = 0; i < fromPoints.length; i++) {
        const fromPoint = fromPoints[i];
        console.log(`${i} FROM: ${fromPoint.formatted_address}`);
        for (let j = 0; j < toPoints.length; j++) {
          const toPoint = toPoints[j];
          const distanceData = result.json.rows[i].elements[j];
          console.log(`   ${j} TO: ${toPoint.formatted_address} =======> ${distanceData.distance.text}`);
        }
      }

      res.status(200).json({
        data: {
          ...result
        }
      });
    } catch (error) {
      debugger;
    }
  } catch (error) {
    next(error);
  }
};
