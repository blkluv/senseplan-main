const BRIGHT_DATA_API_KEY = "b0802d508a7e086e61294edd551a75d3f03177579167350a1fe16551db6c6159" // yes we are commiting api key to github

const brightData = new BrightData(BRIGHT_DATA_API_KEY);

const search_engine = async (query) => {
  const response = await brightData.search(query);
  return response;
};

export default search;