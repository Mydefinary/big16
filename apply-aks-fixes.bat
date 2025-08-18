@echo off
REM AKS 서비스 수정사항 적용 스크립트
REM 작성일: 2025-08-18
REM 실행 전 kubectl 연결 확인 필요

echo ============================================
echo AKS 서비스 수정사항 적용 시작
echo ============================================

echo.
echo 1. 서비스 포트 설정 수정...
kubectl patch svc ppl-gen-frontend-service -p "{\"spec\":{\"ports\":[{\"port\":80,\"targetPort\":3000}]}}"
kubectl patch svc board-frontend-service -p "{\"spec\":{\"ports\":[{\"port\":80,\"targetPort\":80}]}}"
kubectl patch svc webtoon-dashboard-frontend-service -p "{\"spec\":{\"ports\":[{\"port\":80,\"targetPort\":80}]}}"
kubectl patch svc webtoon-hl-frontend-service -p "{\"spec\":{\"ports\":[{\"port\":80,\"targetPort\":80}]}}"

echo.
echo 2. 게이트웨이 ConfigMap 생성...
kubectl delete configmap gateway-config 2>nul
kubectl create configmap gateway-config --from-file=application.yml="gateway/src/main/resources/application-fixed.yml"

echo.
echo 3. 게이트웨이 Deployment에 ConfigMap 마운트...
kubectl patch deployment gateway-deployment-hoa -p "{\"spec\":{\"template\":{\"spec\":{\"volumes\":[{\"name\":\"config-volume\",\"configMap\":{\"name\":\"gateway-config\"}}],\"containers\":[{\"name\":\"gateway-container-hoa\",\"volumeMounts\":[{\"name\":\"config-volume\",\"mountPath\":\"/app/config\",\"readOnly\":true}],\"env\":[{\"name\":\"SPRING_CONFIG_LOCATION\",\"value\":\"classpath:/application.yml,/app/config/application.yml\"}]}]}}}}"

echo.
echo 4. 게이트웨이 재시작...
kubectl rollout restart deployment/gateway-deployment-hoa

echo.
echo 5. 재시작 상태 확인...
kubectl rollout status deployment/gateway-deployment-hoa

echo.
echo 6. ppl-gen 경로 문제 해결...
for /f "tokens=1" %%i in ('kubectl get pods -l app=ppl-gen-frontend --no-headers -o custom-columns=NAME:.metadata.name') do (
    kubectl exec %%i -- sh -c "mkdir -p /usr/share/nginx/html/ppl-gen && cp -r /usr/share/nginx/html/static /usr/share/nginx/html/ppl-gen/ && cp /usr/share/nginx/html/manifest.json /usr/share/nginx/html/ppl-gen/ && cp /usr/share/nginx/html/favicon.ico /usr/share/nginx/html/ppl-gen/ 2>/dev/null && cp /usr/share/nginx/html/logo192.png /usr/share/nginx/html/ppl-gen/ 2>/dev/null"
)

echo.
echo 7. webtoon-dashboard nginx 설정 수정...
for /f "tokens=1" %%i in ('kubectl get pods -l app=webtoon-dashboard-frontend --no-headers -o custom-columns=NAME:.metadata.name') do (
    kubectl cp "nginx-configs/webtoon-dashboard-nginx.conf" %%i:/etc/nginx/conf.d/default.conf
    kubectl exec %%i -- nginx -s reload
)

echo.
echo ============================================
echo 적용 완료!
echo ============================================
echo.
echo 브라우저에서 다음 URL들을 테스트해보세요:
echo - http://20.249.154.2/ppl-gen
echo - http://20.249.154.2/goods-gen  
echo - http://20.249.154.2/webtoon-hl
echo - http://20.249.154.2/webtoon-dashboard
echo - http://20.249.154.2/board
echo.
echo 상세 내용은 AKS-SERVICE-FIXES.md 파일을 참조하세요.

pause