#!/usr/bin/env bash
set -e
export PATH=/ucrt64/bin:$PATH
KL_DIR="/c/Users/ASK_COMP/Downloads/codexos-minios-main/codexos-minios-main/tmp_test_etc/skel/.config/xfce4/xfconf/xfce-perchannel-xml"
rm -rf /c/Users/ASK_COMP/Downloads/codexos-minios-main/codexos-minios-main/tmp_test_etc
mkdir -p "$KL_DIR"
cat > "$KL_DIR/keyboard-layout.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="keyboard-layout" version="1.0">
  <property name="Default" type="empty">
    <property name="XkbLayout" type="string" value="us"/>
  </property>
  <property name="Layouts" type="empty"/>
</channel>
EOF

# run xmlstarlet edit
xmlstarlet ed -L -u '/channel/property[@name="Default"]/property[@name="XkbLayout"]/@value' -v "us" "$KL_DIR/keyboard-layout.xml"

# show file
cat "$KL_DIR/keyboard-layout.xml"
