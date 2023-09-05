import React, { useState, useRef } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import Button from "@mui/material/Button";
import "leaflet/dist/leaflet.css";
import shp from "shpjs";

export default function Fileupload({ fileFormat }) {
  const inputFile = useRef(null);
  const [file, setFile] = useState();
  const [fileContent, setFileContent] = useState("");
  const [geoJSON, setGeoJSON] = useState({});

  const fileExtension = {
    'GeoJSON': '.json',
    'Shapefiles': '.shp',
    'Keyhold(KML)': '.kml'
  }

  function clearInputFile(){
    if(inputFile.current) {
      inputFile.current.value = "";
      inputFile.current.type = "file";
      inputFile.current.accept = ".zip, .json, .shp, .kml";
    }
  }

  const handleSelectFile = (event) => {
    console.log("handleSelectFile");
    setGeoJSON({});
    setFile(event.target.files[0]);

    // only process non-empty file that matches selected file extension
    if(event.target.files[0]){
      if(!event.target.files[0].name.includes(fileExtension[fileFormat])){
        alert("Unmatch upload file format.")
        clearInputFile();
      }
      else{
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
      }
    }
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

  const handleClear = () => {
    setFile(null);
    setFileContent("");
    setGeoJSON({});
    clearInputFile();
  }

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
          ref={inputFile}
          onChange={handleSelectFile}
        />
        <Button variant="outlined" onClick={handleUpload}>
          Upload
        </Button>
        <Button variant="outlined" onClick={handleClear}>
          Clear Map
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
