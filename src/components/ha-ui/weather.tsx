"use client"

import React, { useEffect, useState } from "react"
import {
  mdiAlertCircleCheckOutline,
  mdiWeatherCloudy,
  mdiWeatherFog,
  mdiWeatherHail,
  mdiWeatherLightning,
  mdiWeatherLightningRainy,
  mdiWeatherNight,
  mdiWeatherPartlyCloudy,
  mdiWeatherPouring,
  mdiWeatherRainy,
  mdiWeatherSnowy,
  mdiWeatherSnowyRainy,
  mdiWeatherSunny,
  mdiWeatherWindy,
  mdiWeatherWindyVariant,
} from "@mdi/js"
import Icon from "@mdi/react"
import { RefreshCcwIcon } from "lucide-react"

import type { EntityId } from "@/types/entity-types"
import { haWebSocket } from "@/lib/haWebsocket"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type OptionalWeatherFeatures =
  | "rain_chance"
  | "temperature"
  | "wind_speed"
  | "humidity"
export interface WeatherProps {
  /**
   * HomeAssistant Entity Name
   */
  entity: EntityId
  /**
   * Forecast Type (Optional)
   * Default: daily
   *
   */
  forecastType?: "daily" | "hourly" // | "twice_daily";
  /**
   * Time (minutes) between refreshes (OPTIONAL)
   * How often to refresh data
   * Default: 60mins
   */
  refreshIntervalMinutes?: number
  /**
   * Max amount of days/hours of the forecast to show. (OPTIONAL)
   * NOT inclusive of the current day/hour
   * Default: 7
   */
  maximumForecastShown?: number
  /**
   * Optional Stats to show
   * e.g. ["wind_speed", "temperature"]
   */
  OptionalFeatures?: OptionalWeatherFeatures[]
}

// ---------- Utility Functions ----------

function fetchForecast(
  setForecasts: React.Dispatch<React.SetStateAction<any>>,
  entity: string,
  forecastType: string
) {
  haWebSocket
    .callServiceWithResponse("weather", "get_forecasts", {
      entity_id: entity,
      type: forecastType,
    })
    .then((response) => {
      setForecasts(response?.response?.[entity]?.forecast)
      console.log("Response: ", response)
    })
    .catch((error) => {
      console.error("Service call failed:", error)
    })
}

function WeatherIcon({ condition, ...props }: any) {
  switch (condition) {
    case "clear-night":
      return <Icon path={mdiWeatherNight} {...props} />
    case "cloudy":
      return <Icon path={mdiWeatherCloudy} {...props} />
    case "fog":
      return <Icon path={mdiWeatherFog} {...props} />
    case "hail":
      return <Icon path={mdiWeatherHail} {...props} />
    case "lightning":
      return <Icon path={mdiWeatherLightning} {...props} />
    case "lightning-rainy":
      return <Icon path={mdiWeatherLightningRainy} {...props} />
    case "partlycloudy":
      return <Icon path={mdiWeatherPartlyCloudy} {...props} />
    case "pouring":
      return <Icon path={mdiWeatherPouring} {...props} />
    case "rainy":
      return <Icon path={mdiWeatherRainy} {...props} />
    case "snowy":
      return <Icon path={mdiWeatherSnowy} {...props} />
    case "snowy-rainy":
      return <Icon path={mdiWeatherSnowyRainy} {...props} />
    case "sunny":
      return <Icon path={mdiWeatherSunny} {...props} />
    case "windy":
      return <Icon path={mdiWeatherWindy} {...props} />
    case "windy-variant":
      return <Icon path={mdiWeatherWindyVariant} {...props} />

    case "exceptional":
      return <Icon path={mdiAlertCircleCheckOutline} {...props} />
  }
}
export function Weather({
  entity,
  forecastType = "daily",
  refreshIntervalMinutes = 60,
  maximumForecastShown = 7,
  OptionalFeatures,
}: WeatherProps) {
  const [forecasts, setForecasts] = useState<any[] | null>(null)

  useEffect(() => {
    // Fetch on mount
    fetchForecast(setForecasts, entity, forecastType)

    let timer: number | null = null
    if (refreshIntervalMinutes > 0) {
      timer = window.setInterval(
        () => {
          fetchForecast(setForecasts, entity, forecastType)
        },
        refreshIntervalMinutes * 1000 * 60
      )
    }

    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [entity, forecastType, refreshIntervalMinutes])
  return (
    <div className="flex w-fit flex-col gap-4 p-4">
      <div className="flex w-full justify-between">
        {forecasts && (
          <div className="flex-col">
            <div className="flex w-full gap-2">
              <p>
                {Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
                  new Date(forecasts[0].datetime)
                )}
              </p>
              <div className="flex items-center">
                <WeatherIcon
                  condition={forecasts[0].condition}
                  className="size-6"
                ></WeatherIcon>
                <p> ({forecasts[0].condition})</p>
              </div>
            </div>
            {OptionalFeatures?.includes("humidity") && (
              <div className="flex">
                <p>Humidity: {forecasts[0].humidity}</p>
              </div>
            )}
            {OptionalFeatures?.includes("rain_chance") && (
              <div className="flex">
                <p>Chance of rain: {forecasts[0].precipitation_probability}%</p>
              </div>
            )}
            {OptionalFeatures?.includes("temperature") && (
              <div className="flex">
                <p>
                  Temperature: {forecasts[0].temperature}
                  {forecasts[0].templow && <> ({forecasts[0].templow})</>}
                </p>
              </div>
            )}
            {OptionalFeatures?.includes("wind_speed") && (
              // TODO Automatically grab wind units (Current assumes it is hm/h)
              <div className="flex">
                <p>Wind Speed: {forecasts[0].wind_speed}m/s</p>
              </div>
            )}
          </div>
        )}
        <Button
          size="icon"
          onClick={() => {
            fetchForecast(setForecasts, entity, forecastType)
          }}
        >
          <RefreshCcwIcon />
        </Button>
      </div>

      {forecasts && (
        <div className="bg-accent flex rounded-lg p-2">
          {forecasts.map((forecast: any, index: number) => {
            if (index === 0 || index > maximumForecastShown) return null
            return (
              <div
                key={index}
                className={cn(
                  "flex flex-col items-center",
                  forecastType === "daily" && "w-10", // e.g. slightly wider for daily
                  forecastType === "hourly" && "w-20" // narrower for hourly
                )}
              >
                {forecastType == "daily" && (
                  <p>
                    {Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
                      new Date(forecast.datetime)
                    )}
                  </p>
                )}
                {forecastType == "hourly" && (
                  <p>
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }).format(new Date(forecast.datetime))}
                  </p>
                )}

                <WeatherIcon
                  condition={forecast.condition}
                  className="size-8"
                ></WeatherIcon>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
