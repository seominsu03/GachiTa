import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Button, Card, Notice, ui } from '@/components/ui/DesignSystem';
import { apiRequest } from '@/services/apiClient';
type Place={name:string;address:string;latitude:number;longitude:number};
export function NearbySearch({origin,destination,period,applied,onApply}:{origin:string;destination:string;period:string;applied:Record<string,string>;onApply:(params:Record<string,string>)=>void}){
 const [target,setTarget]=useState<'origin'|'destination'>(applied.nearTarget==='destination'?'destination':'origin');const [radius,setRadius]=useState(Number(applied.radiusMeters)||500);
 const [places,setPlaces]=useState<Place[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);const request=useRef(0);
 useEffect(()=>()=>{request.current++;},[]);
 const apply=(place:Place)=>{setPlaces([]);onApply({origin:target==='origin'?'':origin.trim(),destination:target==='destination'?'':destination.trim(),period,latitude:String(place.latitude),longitude:String(place.longitude),radiusMeters:String(radius),nearTarget:target,nearLabel:place.name,metro:'true'});};
 async function search(){const id=++request.current;setBusy(true);setError(null);try{const query=(target==='origin'?origin:destination).trim();if(query.length<2)throw new Error('위의 '+(target==='origin'?'출발지':'목적지')+'에 장소를 2자 이상 입력해 주세요.');const found=await apiRequest<Place[]>('/api/v1/search-places?query='+encodeURIComponent(query));if(id===request.current){setPlaces(found);if(!found.length)setError('서울·경기 지역의 검색 결과가 없어요. 다른 장소명을 입력해 주세요.');}}catch(e){if(id===request.current)setError(e instanceof Error?e.message:'장소 검색에 실패했어요.');}finally{if(id===request.current)setBusy(false);}}
 async function gps(){const id=++request.current;setBusy(true);setError(null);try{
 const permission=await Location.requestForegroundPermissionsAsync();if(permission.status!=='granted')throw new Error('위치 권한이 없어요. 장소명을 입력해 검색할 수 있습니다.');
 const position=await Promise.race([Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced}),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('위치 조회 시간이 초과됐어요. 장소 검색을 이용해 주세요.')),15000))]);
 const {latitude,longitude}=position.coords;const supported=await apiRequest<boolean>('/api/v1/search-places/region?latitude='+latitude+'&longitude='+longitude);if(!supported)throw new Error('현재 위치는 서울·경기 서비스 지역 밖입니다. 장소 검색을 이용해 주세요.');
 if(id===request.current)apply({name:'현재 위치',address:'',latitude,longitude});
 }catch(e){if(id===request.current)setError(e instanceof Error?e.message:'현재 위치를 확인하지 못했어요.');}finally{if(id===request.current)setBusy(false);}}
 return <Card><Text style={ui.heading}>서울·경기권 거리 검색</Text><Notice>출발지 또는 목적지에 장소를 입력하고 아래에서 기준 장소를 선택하세요. 거리는 직선거리입니다.</Notice>
 <View style={ui.row}>{(['origin','destination'] as const).map(value=><Button key={value} small secondary={target!==value} disabled={busy} onPress={()=>{request.current++;setTarget(value);setPlaces([]);setError(null);}}>{value==='origin'?'출발지 기준':'목적지 기준'}</Button>)}</View>
 <View style={[ui.row,{flexWrap:'wrap'}]}>{[100,300,500,1000].map(value=><Button key={value} small secondary={radius!==value} disabled={busy} onPress={()=>{setRadius(value);if(applied.latitude && applied.longitude && applied.radiusMeters)onApply({...applied,radiusMeters:String(value)});}}>{value===1000?'1km':value+'m'}</Button>)}</View>
 <Button secondary busy={busy} onPress={()=>void search()}>입력한 장소 찾기</Button><Button secondary disabled={busy} onPress={()=>void gps()}>현재 위치로 거리 검색</Button>
 {applied.radiusMeters&&<Notice>적용 중: {applied.nearTarget==='destination'?'목적지':'출발지'} · {applied.nearLabel||'선택 위치'} 반경 {applied.radiusMeters}m</Notice>}
 {error&&<Notice error>{error}</Notice>}
 {places.map((place,index)=><Pressable key={index} accessibilityRole="button" onPress={()=>apply(place)} style={{padding:10}}><Text style={ui.bold}>{place.name}</Text><Text style={ui.muted}>{place.address} · 반경 {radius}m로 검색</Text></Pressable>)}
 {applied.radiusMeters&&<Button small secondary onPress={()=>onApply({origin:'',destination:'',period,latitude:'',longitude:'',radiusMeters:'',nearTarget:'',nearLabel:'',metro:'true'})}>거리 조건 해제</Button>}
 </Card>;
}
