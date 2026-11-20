import PredictionDetail from "./PredictionDetail";
export default async function Detail({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PredictionDetail id={id}/>}

