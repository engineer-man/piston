# remove any lingering write access to others
cd /opt
chown -R root: *
chmod -R o-w *

# cleanup
rm -rf /home/ubuntu
chmod 777 /tmp

# disable cron
systemctl stop cron
systemctl disable cron
