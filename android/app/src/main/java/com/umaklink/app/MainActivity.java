package com.umaklink.app;

import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity
    implements ModifiedMainActivityForSocialLoginPlugin {

  @Override
  public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
    // Marker required by the social login plugin when custom scopes are used.
  }
}
