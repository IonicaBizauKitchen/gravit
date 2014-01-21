(function (_) {
    /**
     * An editor for an ellipse
     * @param {GXEllipse} ellipse the ellipse this editor works on
     * @class GXEllipseEditor
     * @extends GXPathBaseEditor
     * @constructor
     */
    function GXEllipseEditor(ellipse) {
        GXPathBaseEditor.call(this, ellipse);
    };
    GObject.inherit(GXEllipseEditor, GXPathBaseEditor);
    GXElementEditor.exports(GXEllipseEditor, GXEllipse);

    GXEllipseEditor.prototype.START_ANGLE_PART_ID = gUtil.uuid();
    GXEllipseEditor.prototype.END_ANGLE_PART_ID = gUtil.uuid();

    /** @override */
    GXEllipseEditor.prototype.getBBox = function (transform) {
        if (this._showSegmentDetails()) {
            // Return our bbox and expand it by the annotation's approx size
            var targetTransform = transform;
            if (this._transform) {
                targetTransform = this._transform.multiplied(transform);
            }
            var bbox = this.getPaintElement().getGeometryBBox();
            return targetTransform.mapRect(bbox).expanded(
                GXElementEditor.OPTIONS.annotationSizeRegular,
                GXElementEditor.OPTIONS.annotationSizeRegular,
                GXElementEditor.OPTIONS.annotationSizeRegular,
                GXElementEditor.OPTIONS.annotationSizeRegular);
        } else {
            return GXPathBaseEditor.prototype.getBBox.call(this, transform);
        }
    };

    /** @override */
    GXEllipseEditor.prototype.movePart = function (partId, partData, position, ratio) {
        if (!this.hasFlag(GXElementEditor.Flag.Outline)) {
            this.setFlag(GXElementEditor.Flag.Outline);
        } else {
            this.requestInvalidation();
        }

        if (!this._elementPreview) {
            this._elementPreview = new GXEllipse();
            this._elementPreview.transferProperties(this._element, [GXShape.GeometryProperties, GXEllipse.GeometryProperties]);
        }

        var center = this._element.getGeometryBBox().getSide(GRect.Side.CENTER);

        var angle = Math.atan2(position.getY() - center.getY(), position.getX() - center.getX()) - partData;
        
        var moveStart = this._partSelection.indexOf(GXEllipseEditor.prototype.START_ANGLE_PART_ID) >= 0;
        var moveEnd = this._partSelection.indexOf(GXEllipseEditor.prototype.END_ANGLE_PART_ID) >= 0;

        // TODO : Implement this

        //this._elementPreview.setProperties(['sa', 'ea'], [?,?]);
        this.requestInvalidation();
    };

    /** @override */
    GXEllipseEditor.prototype.resetPartMove = function (partId, partData) {
        this._elementPreview = null;
        this.removeFlag(GXElementEditor.Flag.Outline);
    };

    /** @override */
    GXEllipseEditor.prototype.applyPartMove = function (partId, partData) {
        var propertyValues = this._elementPreview.getProperties(['sa', 'ea']);
        this.resetPartMove(partId, partData);
        this._element.setProperties(['sa', 'ea'], propertyValues);
    };

    /** @override */
    GXEllipseEditor.prototype._hasCenterCross = function () {
        return true;
    };

    /** @override */
    GXEllipseEditor.prototype._paintCustom = function (transform, context) {
        // If we have segments then paint 'em
        if (this._showSegmentDetails()) {
            // TODO : Paint start-angle and end-angle annotations
            /*
            this._element.iterateSegments(function (point, inside, angle) {
                var annotation = inside ? GXElementEditor.Annotation.Circle : GXElementEditor.Annotation.Diamond;
                var partId = inside ? GXEllipseEditor.prototype.START_ANGLE_PART_ID : GXEllipseEditor.prototype.END_ANGLE_PART_ID;
                this._paintAnnotation(context, transform, point, annotation, this._partSelection && this._partSelection.indexOf(partId) >= 0, false);
            }.bind(this), true);
            */
        }
    };

    /** @override */
    GXEllipseEditor.prototype._getPartInfoAt = function (location, transform) {
        // If we have segment details then hit-test 'em first
        if (this._showSegmentDetails()) {
            var result = null;
            var pickDist = this._element.getScene() ? this._element.getScene().getProperty('pickDist') / 2 : 1.5;

            // TODO : Get start/end angle part info
            /*
            this._element.iterateSegments(function (point, inside, angle) {
                if (this._getAnnotationBBox(transform, point).expanded(pickDist, pickDist, pickDist, pickDist).containsPoint(location)) {
                    var partId = inside ? GXEllipseEditor.prototype.START_ANGLE_PART_ID : GXEllipseEditor.prototype.END_ANGLE_PART_ID;
                    result = new GXElementEditor.PartInfo(this, partId, angle, true, true);
                    return true;
                }
            }.bind(this), true);
            */

            if (result) {
                return result;
            }
        }

        return null;
    };

    /**
     * @returns {Boolean}
     * @private
     */
    GXEllipseEditor.prototype._showSegmentDetails = function () {
        return this._showAnnotations() && this.hasFlag(GXElementEditor.Flag.Detail) && !this._elementPreview;
    };

    /** @override */
    GXEllipseEditor.prototype.toString = function () {
        return "[Object GXEllipseEditor]";
    };

    _.GXEllipseEditor = GXEllipseEditor;
})(this);