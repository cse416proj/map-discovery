import React, { useState } from "react";
import Button from "@mui/material/Button";
import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ReactLeafletKml from "react-leaflet-kml";
import shp from "shpjs";
import { ShapeFile } from "react-leaflet-shapefile-v2";

export default function Fileupload({ fileFormat }) {
  const [file, setFile] = useState();
  const [fileContent, setFileContent] = useState("");
  const [geoJSON, setGeoJSON] = useState({});
  const [kml, setKml] = useState(null);
  const [shapefile, setShapefile] = useState(null);

  const handleSelectFile = (event) => {
    console.log("handleSelectFile");
    setGeoJSON({});
    setFile(event.target.files[0]);
    const reader = new FileReader();
    if (fileFormat === "GeoJSON") {
      reader.readAsText(event.target.files[0]);
    } else if (fileFormat === "Shapefiles") {
      reader.readAsArrayBuffer(event.target.files[0]);
      console.log(event.target.files[0]);
    } else if (fileFormat === "Keyhole(KML)") {
      reader.readAsText(event.target.files[0]);
    }
    reader.onload = (e) => {
      if (fileFormat === "Shapefiles") {
        console.log(reader.result);
        setFileContent(reader.result);
      } else if (fileFormat === "GeoJSON") {
        setFileContent(reader.result);
      } else if (fileFormat === "Keyhole(KML)") {
        setFileContent(reader.result);
      }
    };
  };

  const handleUpload = () => {
    if (file) {
      if (fileFormat === "GeoJSON") {
        setGeoJSON(JSON.parse(fileContent));
      } else if (fileFormat === "Shapefiles") {
        setShapefile(fileContent);
      } else if (fileFormat === "Keyhole(KML)") {
        const kmlText = new DOMParser().parseFromString(
          fileContent,
          "text/xml"
        );
        setKml(kmlText);
      }
    }
  };

  const handleRegionDisplay = (country, layer) => {
    if (country.properties.admin) {
      layer.bindPopup(country.properties.admin);
    } else {
      const regionType =
        country.properties.ENGTYPE_1 || country.properties.ENGTYPE_2;
      layer.bindPopup(
        regionType === "Province"
          ? country.properties.NAME_1
          : regionType === "District"
          ? country.properties.NAME_2
          : country.properties.NAME_0
      );
    }
  };

  return (
    <div>
      <form>
        <input
          type="file"
          accept=".zip, .json, .shp, .kml"
          onChange={handleSelectFile}
        />
        <Button variant="outlined" onClick={handleUpload}>
          Upload
        </Button>
      </form>
      {geoJSON.features && (
        <MapContainer style={{ height: "80vh" }} center={[0, 0]} zoom={2}>
          <GeoJSON data={geoJSON} onEachFeature={handleRegionDisplay} />
        </MapContainer>
      )}
      {kml && (
        <MapContainer style={{ height: "80vh" }} center={[0, 0]} zoom={2}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <ReactLeafletKml kml={kml} />
        </MapContainer>
      )}
      {shapefile && (
        <MapContainer style={{ height: "80vh" }} center={[0, 0]} zoom={2}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">
            OpenStreetMap</a> contributors'
          />
          <ShapeFile
            data={shapefile}
            // onEachFeature={handleRegionDisplay}
          />
        </MapContainer>
      )}
    </div>
  );
}
