import React, { useState, useRef, useEffect } from "react";
import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import Button from "@mui/material/Button";
import "leaflet/dist/leaflet.css";
import ReactLeafletKml from "react-leaflet-kml";
import * as shapefile from "shapefile";
import JSZip from 'jszip';

export default function Fileupload({ fileFormat }) {
  const inputFile = useRef(null);
  const [fileContent, setFileContent] = useState("");
  const [geoJSON, setGeoJSON] = useState({});
  const [kml, setKml] = useState(null);
  const [shpBuffer, setShpBuffer] = useState(null);
  const [dbfBuffer, setDbfBuffer] = useState(null);

  // define file extension
  const fileExtension = {
    'GeoJSON': 'json',
    'Shapefiles': 'shp/dbf/zip',
    'Keyhole(KML)': 'kml'
  }

  // re-run effect when buffers change
  useEffect(() => {
    if (shpBuffer && dbfBuffer) {
      let features = [];
      shapefile
        .open(shpBuffer, dbfBuffer)
        .then((source) =>
          source.read().then(function log(result) {
            if (result.done) {
              const geoJSON = {
                type: "FeatureCollection",
                features: features,
              };
              setFileContent(geoJSON);
              return;
            }
            features.push(result.value);
            return source.read().then(log);
          })
        )
        .catch((error) => console.error(error.stack));
    }
  }, [shpBuffer, dbfBuffer])

  // for reading .kml & .geojson file
  function readDataAsText(file) {
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result);
    };
    reader.readAsText(file);
  }

  // for reading .shp & .dbf file
  function readDataAsArrayBuffer(file, stateHook){
    const reader = new FileReader();
    reader.onload = () => {
      stateHook(reader.result);
    };
    reader.readAsArrayBuffer(file);
  }

  function readDataFromShapeFiles(shpFile, dbfFile) {
    readDataAsArrayBuffer(shpFile, setShpBuffer);
    readDataAsArrayBuffer(dbfFile, setDbfBuffer);
  }

  // for reading .zip file containing diff file format (we only want .shp & .dbf)
  function readDataFromZipFile(file) {
    const reader = new FileReader();

    reader.onload = () => {
        const zipData = reader.result;
        const jszip = new JSZip();

        jszip.loadAsync(zipData).then((zip) => {
          zip.forEach((fileName, file) => {
            // ignore file that is not .shp/.dbf
            const fileType = fileName.split(".").pop();
            if(fileType !== 'shp' && fileType !== 'dbf'){
              return;
            }

            // Read file content by arraybuffer type
            file.async("arraybuffer").then((content) => {
              if(fileType === 'shp')
                setShpBuffer(content);
              else
                setDbfBuffer(content);
            });
          });
      });
    };
    reader.readAsArrayBuffer(file);
  }

  // handle selected file input
  const handleSelectFile = (event) => {
    setGeoJSON({});
    setKml(null);

    const fileCount = event.target.files.length;
    // only process non-empty file that matches selected file extension
    if (event.target.files[0] && fileFormat) {
      const fileType = event.target.files[0].name.split(".").pop();
      const fileType2 = fileCount === 2 ? event.target.files[1].name.split(".").pop() : '';
      if ((fileFormat === 'Shapefiles' && ((fileCount !== 2 && fileType !== 'zip') || !fileExtension[fileFormat].includes(fileType2))) || !fileExtension[fileFormat].includes(fileType)) {
        alert("Unmatch upload file format.");
        clearInputFile();
      } else {
        if (fileFormat === "GeoJSON") {
          readDataAsText(event.target.files[0]);
        } else if (fileFormat === "Shapefiles") {
          if (fileType === "shp" || fileType === 'dbf') {
            var shpFile =  (fileType === "shp") ? event.target.files[0] : event.target.files[1];
            var dbfFile =  (fileType === "dbf") ? event.target.files[0] : event.target.files[1];
            readDataFromShapeFiles(shpFile, dbfFile);
          } else if (fileType === "zip") {
            readDataFromZipFile(event.target.files[0]);
          }
        } else if (fileFormat === "Keyhole(KML)") {
          readDataAsText(event.target.files[0]);
        }
      }
    }
  };

  // handle map rendering after upload file & choose format
  const handleUpload = () => {
    if(!fileFormat){
      alert('Please select file format with at least one file.');
      return;
    }

    if(fileContent){
      if (fileFormat === "GeoJSON") {
        setGeoJSON(JSON.parse(fileContent));
      } else if (fileFormat === "Shapefiles") {
        setGeoJSON(fileContent);
      } else if (fileFormat === "Keyhole(KML)") {
        const kmlText = new DOMParser().parseFromString(
          fileContent,
          "text/xml"
        );
        setKml(kmlText);
      }
    }
  };

  // for clearing input file
  function clearInputFile() {
    if (inputFile.current) {
      inputFile.current.value = "";
      inputFile.current.type = "file";
      inputFile.current.accept = ".zip, .json, .shp, .kml, .dbf";
    }
  }

  // handle clearing all inputs
  const handleClear = () => {
    setFileContent("");
    setGeoJSON({});
    setKml(null);
    setDbfBuffer(null);
    setShpBuffer(null);
    clearInputFile();
  };

  // handle display region names
  const handleRegionDisplay = (country, layer) => {
    if (country.properties.admin) {
      layer.bindPopup(country.properties.admin);
    } else {
      console.log(country.properties);
      layer.bindPopup(
        (country.properties.ENGTYPE_1) ? country.properties.NAME_1 :
        (country.properties.ENGTYPE_2) ? country.properties.NAME_2 :
        (country.properties.ENGTYPE_3) ? country.properties.NAME_3 :
        (country.properties.NAME_0) ? country.properties.NAME_0:
        country.properties.NAME
      );
    }
  };

  return (
    <div>
      <form>
        <input
          type="file"
          accept=".zip, .json, .shp, .kml, .dbf"
          multiple
          ref={inputFile}
          onChange={handleSelectFile}
        />
        <Button variant="contained" onClick={handleUpload}>
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
      {kml && (
        <MapContainer style={{ height: "80vh" }} center={[0, 0]} zoom={2}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <ReactLeafletKml kml={kml}/>
        </MapContainer>
      )}
    </div>
  );
}
