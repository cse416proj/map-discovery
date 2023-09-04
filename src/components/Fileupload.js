import React, { useState } from "react";
import Button from "@mui/material/Button";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";

export default function Fileupload({ fileFormat }) {
  const [file, setFile] = useState();
  const [fileContent, setFileContent] = useState("");
  const [geoJSON, setGeoJSON] = useState({});

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
    }
    reader.onload = async (e) => {
      if (fileFormat === "Shapefiles") {
        console.log(reader.result);
        const geojson = await shp(reader.result);
      } else if (fileFormat === "GeoJSON") {
        setFileContent(reader.result);
      }
    };
  };

  const handleUpload = () => {
    if (file) {
      if (fileFormat === "GeoJSON") {
        setGeoJSON(JSON.parse(fileContent));
      } else if (fileFormat === "Shapefiles") {
        setGeoJSON(fileContent);
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
    </div>
  );
}
