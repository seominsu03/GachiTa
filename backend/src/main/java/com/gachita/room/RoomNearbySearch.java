package com.gachita.room;
import com.gachita.common.ApiException;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class RoomNearbySearch {
 private final EntityManager em;
 public RoomNearbySearch(EntityManager em) { this.em=em; }
 public List<RoomResponse> search(String origin,String destination,String period,Double latitude,Double longitude,Integer radius,String target,boolean metro) {
  boolean nearby=latitude!=null || longitude!=null || radius!=null;
  if (nearby && (latitude==null || longitude==null || radius==null || !Double.isFinite(latitude) || !Double.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || !List.of(100,300,500,1000).contains(radius) || !List.of("origin","destination").contains(target)))
   throw new ApiException(HttpStatus.BAD_REQUEST,"INVALID_NEARBY_SEARCH","좌표와 반경(100·300·500·1000m), 출발지 또는 목적지를 확인해 주세요.");
  var hours=DeparturePeriod.parse(period);
  String sql="select * from taxi_rooms r where r.status not in ('COMPLETED','CANCELLED') and locate(lower(:origin),lower(r.origin_name))>0 and locate(lower(:destination),lower(r.destination_name))>0 and mod(hour(r.departure_at)+9,24)>=:startHour and mod(hour(r.departure_at)+9,24)<:endHour";
  // Regional envelope limits the service area; place suggestions use actual Seoul/Gyeonggi addresses.
  if(metro) sql+=" and r.origin_latitude between 36.85 and 38.30 and r.origin_longitude between 126.35 and 127.90 and r.destination_latitude between 36.85 and 38.30 and r.destination_longitude between 126.35 and 127.90";
  if(nearby) {
   String lat="r."+target+"_latitude", lon="r."+target+"_longitude";
   sql+=" and 12742000 * asin(sqrt(least(1.0, greatest(0.0, power(sin(radians("+lat+"-:lat)/2),2)+cos(radians(:lat))*cos(radians("+lat+"))*power(sin(radians("+lon+"-:lon)/2),2))))) <= :radius";
  }
  sql+=" order by r.departure_at desc,r.room_id desc";
  var query=em.createNativeQuery(sql,TaxiRoom.class).setParameter("origin",origin.strip()).setParameter("destination",destination.strip()).setParameter("startHour",hours.startHour()).setParameter("endHour",hours.endHour());
  if(nearby) query.setParameter("lat",latitude).setParameter("lon",longitude).setParameter("radius",radius);
  return ((List<TaxiRoom>)query.setMaxResults(100).getResultList()).stream().map(RoomResponse::from).toList();
 }
}
