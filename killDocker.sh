a=`sudo docker ps|head -n 2|tail -n 1|awk '{ print $1 }'`
echo $a
sudo docker stop $a
sudo docker rm $a