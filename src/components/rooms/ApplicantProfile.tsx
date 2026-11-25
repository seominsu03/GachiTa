import { useEffect, useState } from 'react';
import { Modal, Text, View, ScrollView } from 'react-native';
import { Button, Card, Notice, ui } from '@/components/ui/DesignSystem';
import { apiRequest } from '@/services/apiClient';
type Summary={ averageRating:number|null;reviewCount:number;rideCount:number;reviews:{rating:number;comment:string|null}[] };
export function ApplicantProfile({roomId,userId,nickname,onClose}:{roomId:number;userId:number;nickname:string;onClose:()=>void}){
 const [data,setData]=useState<Summary|null>(null);const [error,setError]=useState<string|null>(null);
 useEffect(()=>{let active=true;apiRequest<Summary>('/api/v1/rooms/'+roomId+'/applicants/'+userId+'/profile').then(value=>{if(active)setData(value);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[roomId,userId]);
 return <Modal visible transparent animationType="fade" onRequestClose={onClose}><View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:'#00000055'}}><Card style={{backgroundColor:'#fff',maxHeight:'85%'}}>
 <Text style={ui.heading}>{nickname} 프로필</Text><ScrollView>
 {error?<Notice error>{error}</Notice>:!data?<Notice>프로필을 불러오고 있어요.</Notice>:<View style={{gap:12}}>
 <Text style={ui.body}>평점 {data.averageRating===null?'평가 없음':data.averageRating.toFixed(1)} · 후기 {data.reviewCount}개</Text>
 <Text style={ui.body}>이용 횟수 {data.rideCount}회</Text><Notice>이용 횟수는 정산이 완료된 동승 기준입니다.</Notice>
 {data.reviews.length===0&&<Notice>아직 받은 후기가 없어요.</Notice>}
 {data.reviews.map((review,index)=><Card key={index}><Text style={ui.bold}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</Text>{review.comment&&<Text style={ui.body}>{review.comment}</Text>}</Card>)}
 </View>}</ScrollView><Button secondary onPress={onClose}>닫기</Button></Card></View></Modal>;
}
